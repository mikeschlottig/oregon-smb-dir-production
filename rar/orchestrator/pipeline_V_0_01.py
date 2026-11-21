"""
End-to-End Orchestrator Pipeline
Coordinates sampling profile generation, rate-limited harvesting, circuit-breaker guards, and atomic SQLite commits.
"""
import asyncio
import hashlib
import json
import random
import uuid
from datetime import datetime, timezone
from typing import Optional, Callable, Awaitable, List

from rar.schemas.data_models_V_0_01 import (
    SamplingProfile,
    ScanManifest,
    ScanStatus,
    GridPoint,
    RankObservation,
    AcquisitionStatus,
    FrameType,
    SearchSurface,
)
from rar.geometry.polar_grid_V_0_01 import generate_polar_grid
from rar.geometry.h3_grid_V_0_01 import generate_h3_disk_grid
from rar.storage.artifact_store_V_0_01 import ArtifactStorageEngine
from rar.storage.sqlite_store_V_0_01 import SQLiteEvidenceStore
from rar.proxy.proxy_adapter_V_0_01 import ProxyRotationManager
from rar.harvester.maps_harvester_V_0_01 import harvest_single_point


class ScanOrchestrationPipeline:
    """
    Orchestrates an end-to-end local search geo-grid scan with rate limits and circuit breaker controls.
    """
    def __init__(
        self,
        sqlite_store: SQLiteEvidenceStore,
        artifact_store: ArtifactStorageEngine,
        proxy_manager: Optional[ProxyRotationManager] = None,
        harvester_worker: Optional[Callable[..., Awaitable[RankObservation]]] = None,
        max_consecutive_circuit_failures: int = 2,
    ):
        self.sqlite_store = sqlite_store
        self.artifact_store = artifact_store
        self.proxy_manager = proxy_manager
        self.harvester_worker = harvester_worker or harvest_single_point
        self.max_consecutive_circuit_failures = max_consecutive_circuit_failures

    def generate_grid_points(self, profile: SamplingProfile) -> List[GridPoint]:
        """
        Generates the spatial coordinate grid according to the sampling profile frame.
        """
        if profile.frame_type == FrameType.BUSINESS_CENTERED_POLAR:
            if not profile.target_entity:
                raise ValueError("Business-Centered Polar Frame requires a target_entity with coordinates.")
            radii = profile.extra_metadata.get("radii_miles")
            bearings = profile.extra_metadata.get("bearings")
            return generate_polar_grid(
                center_lat=profile.target_entity.latitude,
                center_lng=profile.target_entity.longitude,
                radii_miles=radii,
                bearings=bearings,
                allowed_surface=profile.target_surface,
                prefix_id=profile.profile_id,
            )

        elif profile.frame_type == FrameType.MARKET_FIXED_H3:
            center_lat = profile.extra_metadata.get("center_lat")
            center_lng = profile.extra_metadata.get("center_lng")
            k_rings = profile.extra_metadata.get("k_rings", 2)
            resolution = profile.extra_metadata.get("resolution", 8)
            if center_lat is None or center_lng is None:
                if profile.target_entity:
                    center_lat = profile.target_entity.latitude
                    center_lng = profile.target_entity.longitude
                else:
                    raise ValueError("Market-Fixed H3 Frame requires center coordinates.")

            return generate_h3_disk_grid(
                center_lat=center_lat,
                center_lng=center_lng,
                k_rings=k_rings,
                resolution=resolution,
                allowed_surface=profile.target_surface,
                prefix_id=profile.profile_id,
            )

        raise ValueError(f"Unsupported frame type: {profile.frame_type}")

    async def execute_scan(
        self,
        profile: SamplingProfile,
        min_delay_sec: float = 1.5,
        max_delay_sec: float = 3.5,
    ) -> ScanManifest:
        """
        Executes the full sequential scan over the generated grid points with rate limiting.
        """
        scan_id = f"scan_{uuid.uuid4().hex[:12]}"
        start_time = datetime.now(timezone.utc).isoformat()
        
        # 1. Generate grid points
        points = self.generate_grid_points(profile)
        point_ids = [p.point_id for p in points]
        
        # 2. Initialize and save manifest
        manifest = ScanManifest(
            scan_id=scan_id,
            profile_id=profile.profile_id,
            query_string=profile.query_string,
            target_surface=profile.target_surface,
            frame_type=profile.frame_type,
            status=ScanStatus.IN_PROGRESS,
            start_time=start_time,
            total_points=len(points),
            completed_points=0,
            failed_points=0,
            point_ids=point_ids,
        )
        self.sqlite_store.save_scan_manifest(manifest)

        consecutive_failures = 0
        observation_digests: List[str] = []

        # 3. Process points
        for idx, point in enumerate(points):
            try:
                # Harvest observation
                observation = await self.harvester_worker(
                    grid_point=point,
                    query=profile.query_string,
                    scan_id=scan_id,
                    storage=self.artifact_store,
                    proxy_manager=self.proxy_manager,
                    viewport_zoom=profile.viewport_zoom,
                )

                # Persist observation
                self.sqlite_store.save_observation(observation)
                observation_digests.append(f"{observation.point_id}:{observation.status.value}")

                if observation.status == AcquisitionStatus.SUCCESS:
                    manifest.completed_points += 1
                    consecutive_failures = 0
                else:
                    manifest.failed_points += 1
                    consecutive_failures += 1

                # Check Circuit Breaker
                if consecutive_failures >= self.max_consecutive_circuit_failures:
                    print(f"[!] CIRCUIT BREAKER TRIPPED at point {point.point_id}. Halting scan {scan_id}.")
                    manifest.status = ScanStatus.ABORTED_CIRCUIT_BREAKER
                    break

            except Exception as e:
                print(f"[ERROR] Exception during harvest of {point.point_id}: {e}")
                manifest.failed_points += 1
                consecutive_failures += 1
                if consecutive_failures >= self.max_consecutive_circuit_failures:
                    manifest.status = ScanStatus.ABORTED_CIRCUIT_BREAKER
                    break

            # Polite lognormal inter-point delay if more points remain
            if idx < len(points) - 1 and manifest.status != ScanStatus.ABORTED_CIRCUIT_BREAKER:
                delay = random.uniform(min_delay_sec, max_delay_sec)
                await asyncio.sleep(delay)

        # 4. Conclude scan manifest
        manifest.end_time = datetime.now(timezone.utc).isoformat()
        if manifest.status != ScanStatus.ABORTED_CIRCUIT_BREAKER:
            if manifest.failed_points == 0:
                manifest.status = ScanStatus.COMPLETED
            elif manifest.completed_points > 0:
                manifest.status = ScanStatus.PARTIALLY_COMPLETED
            else:
                manifest.status = ScanStatus.FAILED

        # Compute cryptographic manifest hash
        manifest_payload = f"{scan_id}:{manifest.status.value}:{','.join(observation_digests)}"
        manifest.manifest_sha256 = hashlib.sha256(manifest_payload.encode("utf-8")).hexdigest()

        # Final commit to SQLite
        self.sqlite_store.save_scan_manifest(manifest)
        return manifest
