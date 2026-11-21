"""
RAR CLI Runner — Provider-Independent Local Search Geo-Grid Engine
Version: V-0.01

Commands:
  scan:    Executes an orchestrated geo-grid harvest against Google Maps Viewports.
  summary: Displays aggregated rankings and decay statistics for a past scan.
  list:    Lists all scans stored in the SQLite evidence database.
  verify:  Performs SHA-256 cryptographic tamper verification on stored artifacts.
"""
import argparse
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from rar.schemas.data_models_V_0_01 import (
    SamplingProfile,
    BusinessEntity,
    FrameType,
    SearchSurface,
    ScanStatus,
    RankObservation,
    BusinessResult,
    AcquisitionStatus,
)
from rar.storage.sqlite_store_V_0_01 import SQLiteEvidenceStore
from rar.storage.artifact_store_V_0_01 import ArtifactStorageEngine
from rar.orchestrator.pipeline_V_0_01 import ScanOrchestrationPipeline
from rar.harvester.maps_harvester_V_0_01 import harvest_single_point


async def mock_harvester(
    grid_point,
    query,
    scan_id,
    storage,
    proxy_manager=None,
    viewport_zoom=14,
    **kwargs
) -> RankObservation:
    """
    Mock harvester for dry-runs and offline integration testing.
    Simulates realistic distance-decay ranking behavior.
    """
    await asyncio.sleep(0.05)
    obs_id = f"obs_mock_{grid_point.point_id}"
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Calculate synthetic rank based on distance from centroid
    dist = grid_point.ring_radius_miles or 0.0
    if dist == 0.0:
        target_rank = 1
    elif dist <= 0.5:
        target_rank = 2
    elif dist <= 1.0:
        target_rank = 3
    elif dist <= 2.0:
        target_rank = 6
    elif dist <= 4.0:
        target_rank = 12
    else:
        target_rank = 18

    mock_listings = [
        BusinessResult(
            rank=target_rank,
            name="Target Calibration Entity",
            cid="8553118415606061088",
            rating=4.8,
            reviews_count=1250,
            category="Plumber",
            address="Austin, TX",
        ),
        BusinessResult(
            rank=1 if target_rank != 1 else 2,
            name="Apex Local Competitor",
            cid="1000200030004000500",
            rating=4.9,
            reviews_count=890,
            category="Plumber",
            address="Austin, TX",
        ),
    ]
    mock_listings.sort(key=lambda x: x.rank)

    # Store dummy artifacts to verify storage engine
    dummy_html = f"<html><body>Mock harvest for {grid_point.point_id}</body></html>"
    ref = storage.store_artifacts(scan_id, grid_point.point_id, dummy_html, screenshot_bytes=b"PNG_MOCK")

    return RankObservation(
        observation_id=obs_id,
        scan_id=scan_id,
        point_id=grid_point.point_id,
        status=AcquisitionStatus.SUCCESS,
        requested_coordinate=(grid_point.latitude, grid_point.longitude),
        viewport_zoom=viewport_zoom,
        search_surface=SearchSurface.GOOGLE_MAPS_VIEWPORT,
        query=query,
        timestamp=timestamp,
        ranked_businesses=mock_listings,
        artifact_ref=ref,
        censoring_horizon=20,
    )


def print_banner():
    print("=" * 72)
    print("  RANKS ABOVE REPLACEMENT (RAR) — LOCAL SEARCH GEO-GRID ENGINE")
    print("  Provider-Independent Local Search Measurement & Spatial Calibration")
    print("=" * 72)


async def run_scan_command(args):
    print_banner()
    db_path = args.db
    artifacts_dir = args.artifacts
    os.makedirs(artifacts_dir, exist_ok=True)

    sqlite_store = SQLiteEvidenceStore(db_path=db_path)
    artifact_store = ArtifactStorageEngine(base_directory=artifacts_dir)

    radii = [float(r.strip()) for r in args.radii.split(",")] if args.radii else [0.0, 0.5, 1.0, 2.0, 4.0]
    frame_type = FrameType.BUSINESS_CENTERED_POLAR if args.frame == "polar" else FrameType.MARKET_FIXED_H3

    bearings = None
    if args.cardinal_only:
        bearings = [(0.0, "N"), (90.0, "E"), (180.0, "S"), (270.0, "W")]

    entity = BusinessEntity(
        business_id=f"ent_{uuid.uuid4().hex[:8]}",
        canonical_name=args.business_name or args.query,
        latitude=args.lat,
        longitude=args.lng,
        cid=args.cid,
    )

    profile = SamplingProfile(
        profile_id=f"prof_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
        target_entity=entity,
        frame_type=frame_type,
        target_surface=SearchSurface.GOOGLE_MAPS_VIEWPORT,
        query_string=args.query,
        viewport_zoom=args.zoom,
        extra_metadata={
            "radii_miles": radii,
            "bearings": bearings,
            "k_rings": args.k_rings,
            "resolution": args.h3_res,
        },
    )

    harvester = mock_harvester if args.mock else harvest_single_point
    pipeline = ScanOrchestrationPipeline(
        sqlite_store=sqlite_store,
        artifact_store=artifact_store,
        harvester_worker=harvester,
        max_consecutive_circuit_failures=2,
    )

    print(f"\n[*] Target Entity:    {entity.canonical_name}")
    print(f"[*] Search Surface:   {profile.target_surface.value} (STRICT VIEWPORT)")
    print(f"[*] Centroid:         ({entity.latitude:.5f}, {entity.longitude:.5f})")
    print(f"[*] Query String:     '{profile.query_string}'")
    print(f"[*] Frame Geometry:   {profile.frame_type.value}")
    if frame_type == FrameType.BUSINESS_CENTERED_POLAR:
        print(f"[*] Radial Rings:     {radii} miles (Total Pins: {1 + (len(radii)-1)*8 if 0.0 in radii else len(radii)*8})")
    print(f"[*] Execution Mode:   {'MOCK (Dry Run)' if args.mock else 'LIVE REAL CHROME'}")
    print(f"[*] Evidence SQLite:  {db_path}")
    print(f"[*] Evidence Storage: {artifacts_dir}")
    print("-" * 72)

    manifest = await pipeline.execute_scan(
        profile=profile,
        min_delay_sec=args.min_delay,
        max_delay_sec=args.max_delay,
    )

    print("\n" + "=" * 72)
    print(f"  SCAN RESULT: {manifest.status.value}")
    print("=" * 72)
    print(f"  Scan ID:            {manifest.scan_id}")
    print(f"  Total Pins:         {manifest.total_points}")
    print(f"  Completed:          {manifest.completed_points}")
    print(f"  Failed:             {manifest.failed_points}")
    print(f"  Manifest SHA-256:   {manifest.manifest_sha256}")
    print("-" * 72)

    # Display target entity performance if CID provided
    if args.cid:
        ranks = sqlite_store.get_rankings_by_cid(manifest.scan_id, args.cid)
        print(f"\n[*] Target CID Rankings ({args.cid}):")
        if ranks:
            print(f"{'Point ID':<32} {'Rank':<6} {'Coords':<24}")
            print("-" * 64)
            for r in ranks:
                coords_str = f"({r['latitude']:.4f}, {r['longitude']:.4f})"
                print(f"{r['point_id']:<32} #{r['rank']:<5} {coords_str:<24}")
        else:
            print(f"  Target CID {args.cid} was not observed in top 20 rankings.")

    summary = sqlite_store.get_scan_summary(manifest.scan_id)
    print(f"\n[*] Market Breadth:")
    print(f"  Unique Businesses Ranked: {summary.get('unique_names', 0)}")
    print(f"  Unique CIDs Captured:     {summary.get('unique_cids', 0)}")
    print("=" * 72 + "\n")


def run_summary_command(args):
    print_banner()
    sqlite_store = SQLiteEvidenceStore(db_path=args.db)
    manifest = sqlite_store.get_scan_manifest(args.scan_id)
    if not manifest:
        print(f"[!] Scan '{args.scan_id}' not found in database {args.db}")
        return

    print(f"\n[*] Scan Manifest Summary: {manifest.scan_id}")
    print(f"  Profile ID:       {manifest.profile_id}")
    print(f"  Query:            '{manifest.query_string}'")
    print(f"  Status:           {manifest.status.value}")
    print(f"  Surface:          {manifest.target_surface.value}")
    print(f"  Frame:            {manifest.frame_type.value}")
    print(f"  Total Points:     {manifest.total_points}")
    print(f"  Completed Points: {manifest.completed_points}")
    print(f"  Failed Points:    {manifest.failed_points}")
    print(f"  Start Time:       {manifest.start_time}")
    print(f"  End Time:         {manifest.end_time}")
    print(f"  Manifest SHA-256: {manifest.manifest_sha256}")

    summary = sqlite_store.get_scan_summary(args.scan_id)
    print(f"\n[*] Observations Summary:")
    for status, count in summary.get("status_breakdown", {}).items():
        print(f"  Status {status}: {count} observations")
    print(f"  Unique Businesses: {summary.get('unique_names', 0)}")
    print(f"  Unique CIDs:       {summary.get('unique_cids', 0)}")

    if args.cid:
        ranks = sqlite_store.get_rankings_by_cid(args.scan_id, args.cid)
        print(f"\n[*] Tracking for CID {args.cid}:")
        if ranks:
            for r in ranks:
                print(f"  - Pin {r['point_id']}: Rank #{r['rank']} ({r['latitude']:.4f}, {r['longitude']:.4f})")
        else:
            print("  - CID not present in top rankings.")
    print("=" * 72)


def run_list_command(args):
    print_banner()
    sqlite_store = SQLiteEvidenceStore(db_path=args.db)
    with sqlite_store._get_connection() as conn:
        rows = conn.execute(
            "SELECT scan_id, query_string, status, total_points, completed_points, start_time FROM scans ORDER BY start_time DESC"
        ).fetchall()

    print(f"\n{'Scan ID':<24} {'Status':<16} {'Query':<20} {'Progress':<12} {'Start Time':<24}")
    print("-" * 96)
    for r in rows:
        prog = f"{r['completed_points']}/{r['total_points']}"
        print(f"{r['scan_id']:<24} {r['status']:<16} {r['query_string']:<20} {prog:<12} {r['start_time']:<24}")
    print("=" * 96)


def run_verify_command(args):
    print_banner()
    file_path = args.file
    if not os.path.exists(file_path):
        print(f"[!] File does not exist: {file_path}")
        sys.exit(1)

    import hashlib
    with open(file_path, "rb") as f:
        actual_hash = hashlib.sha256(f.read()).hexdigest()

    print(f"\n[*] File:          {file_path}")
    print(f"[*] Computed Hash: {actual_hash}")
    if args.expected:
        print(f"[*] Expected Hash: {args.expected}")
        if actual_hash.lower() == args.expected.lower():
            print("\n[✔] VERIFICATION PASSED: SHA-256 match confirmed. Artifact is authentic and untampered.")
        else:
            print("\n[✖] VERIFICATION FAILED: Hash mismatch! Possible artifact corruption or tampering.")
            sys.exit(2)
    print("=" * 72)


def main():
    parser = argparse.ArgumentParser(
        description="RAR (Ranks Above Replacement) — Provider-Independent Local Search Geo-Grid Engine"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Subcommand: scan
    scan_parser = subparsers.add_parser("scan", help="Run a local search geo-grid scan")
    scan_parser.add_argument("--query", "-q", required=True, help="Search query string (e.g. 'plumbers')")
    scan_parser.add_argument("--lat", type=float, required=True, help="Target centroid latitude (WGS84)")
    scan_parser.add_argument("--lng", type=float, required=True, help="Target centroid longitude (WGS84)")
    scan_parser.add_argument("--business-name", "-n", help="Canonical business name")
    scan_parser.add_argument("--cid", help="Google Customer ID (decimal ludocid) to track")
    scan_parser.add_argument("--frame", choices=["polar", "h3"], default="polar", help="Spatial frame type")
    scan_parser.add_argument("--radii", default="0.0,0.5,1.0,2.0", help="Comma-separated polar radii in miles")
    scan_parser.add_argument("--cardinal-only", action="store_true", help="Sample only 4 cardinal directions (N, E, S, W) instead of 8")
    scan_parser.add_argument("--k-rings", type=int, default=1, help="H3 disk k-rings")
    scan_parser.add_argument("--h3-res", type=int, default=8, help="H3 resolution")
    scan_parser.add_argument("--zoom", type=int, default=14, help="Google Maps viewport zoom (default: 14)")
    scan_parser.add_argument("--db", default="rar_evidence.db", help="Path to SQLite evidence database")
    scan_parser.add_argument("--artifacts", default="artifacts", help="Directory for raw HTML/screenshot artifacts")
    scan_parser.add_argument("--min-delay", type=float, default=2.0, help="Minimum delay between pins (seconds)")
    scan_parser.add_argument("--max-delay", type=float, default=4.5, help="Maximum delay between pins (seconds)")
    scan_parser.add_argument("--mock", action="store_true", help="Execute in mock simulation mode without network")

    # Subcommand: summary
    summary_parser = subparsers.add_parser("summary", help="Display summary for a completed scan")
    summary_parser.add_argument("--scan-id", "-s", required=True, help="Scan ID to query")
    summary_parser.add_argument("--cid", help="Target business CID to display rankings for")
    summary_parser.add_argument("--db", default="rar_evidence.db", help="Path to SQLite database")

    # Subcommand: list
    list_parser = subparsers.add_parser("list", help="List all scans in the database")
    list_parser.add_argument("--db", default="rar_evidence.db", help="Path to SQLite database")

    # Subcommand: verify
    verify_parser = subparsers.add_parser("verify", help="Verify cryptographic SHA-256 artifact hash")
    verify_parser.add_argument("--file", "-f", required=True, help="Path to file to hash")
    verify_parser.add_argument("--expected", "-e", help="Expected SHA-256 hex digest to compare against")

    args = parser.parse_args()

    if args.command == "scan":
        asyncio.run(run_scan_command(args))
    elif args.command == "summary":
        run_summary_command(args)
    elif args.command == "list":
        run_list_command(args)
    elif args.command == "verify":
        run_verify_command(args)


if __name__ == "__main__":
    main()
