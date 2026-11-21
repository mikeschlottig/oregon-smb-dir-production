"""
SQLite Relational Evidence Store
Persists structured ScanManifest, RankObservation, and BusinessResult records with indexing.
"""
import contextlib
import json
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any, Generator

from rar.schemas.data_models_V_0_01 import (
    ScanManifest,
    RankObservation,
    BusinessResult,
    AcquisitionStatus,
    SearchSurface,
    RawArtifactReference,
    ScanStatus,
    FrameType,
)


class SQLiteEvidenceStore:
    """
    Manages local SQLite database persistence for scans, observations, and rankings.
    """
    def __init__(self, db_path: str = "rar_evidence.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    @contextlib.contextmanager
    def _get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def init_db(self):
        with self._get_connection() as conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS scans (
                scan_id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                query_string TEXT NOT NULL,
                target_surface TEXT NOT NULL,
                frame_type TEXT NOT NULL,
                status TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                total_points INTEGER NOT NULL,
                completed_points INTEGER DEFAULT 0,
                failed_points INTEGER DEFAULT 0,
                manifest_sha256 TEXT,
                point_ids_json TEXT
            );

            CREATE TABLE IF NOT EXISTS observations (
                observation_id TEXT PRIMARY KEY,
                scan_id TEXT NOT NULL,
                point_id TEXT NOT NULL,
                status TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                viewport_zoom INTEGER NOT NULL,
                search_surface TEXT NOT NULL,
                query TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                html_sha256 TEXT,
                screenshot_sha256 TEXT,
                html_path TEXT,
                screenshot_path TEXT,
                censoring_horizon INTEGER DEFAULT 20,
                FOREIGN KEY (scan_id) REFERENCES scans (scan_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS rankings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                observation_id TEXT NOT NULL,
                scan_id TEXT NOT NULL,
                rank INTEGER NOT NULL,
                business_name TEXT NOT NULL,
                cid TEXT,
                place_id TEXT,
                address TEXT,
                rating REAL,
                reviews_count INTEGER,
                category TEXT,
                maps_url TEXT,
                FOREIGN KEY (observation_id) REFERENCES observations (observation_id) ON DELETE CASCADE,
                FOREIGN KEY (scan_id) REFERENCES scans (scan_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_obs_scan_id ON observations(scan_id);
            CREATE INDEX IF NOT EXISTS idx_obs_point_id ON observations(point_id);
            CREATE INDEX IF NOT EXISTS idx_obs_status ON observations(status);
            CREATE INDEX IF NOT EXISTS idx_rank_scan_id ON rankings(scan_id);
            CREATE INDEX IF NOT EXISTS idx_rank_cid ON rankings(cid);
            CREATE INDEX IF NOT EXISTS idx_rank_obs_id ON rankings(observation_id);
            """)

    def save_scan_manifest(self, manifest: ScanManifest):
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO scans (
                    scan_id, profile_id, query_string, target_surface, frame_type,
                    status, start_time, end_time, total_points, completed_points,
                    failed_points, manifest_sha256, point_ids_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(scan_id) DO UPDATE SET
                    status=excluded.status,
                    end_time=excluded.end_time,
                    completed_points=excluded.completed_points,
                    failed_points=excluded.failed_points,
                    manifest_sha256=excluded.manifest_sha256,
                    point_ids_json=excluded.point_ids_json
                """,
                (
                    manifest.scan_id,
                    manifest.profile_id,
                    manifest.query_string,
                    manifest.target_surface.value,
                    manifest.frame_type.value,
                    manifest.status.value,
                    manifest.start_time,
                    manifest.end_time,
                    manifest.total_points,
                    manifest.completed_points,
                    manifest.failed_points,
                    manifest.manifest_sha256,
                    json.dumps(manifest.point_ids),
                ),
            )

    def save_observation(self, obs: RankObservation):
        with self._get_connection() as conn:
            html_sha256 = obs.artifact_ref.html_sha256 if obs.artifact_ref else None
            screenshot_sha256 = obs.artifact_ref.screenshot_sha256 if obs.artifact_ref else None
            html_path = obs.artifact_ref.html_path if obs.artifact_ref else None
            screenshot_path = obs.artifact_ref.screenshot_path if obs.artifact_ref else None

            conn.execute(
                """
                INSERT INTO observations (
                    observation_id, scan_id, point_id, status, latitude, longitude,
                    viewport_zoom, search_surface, query, timestamp,
                    html_sha256, screenshot_sha256, html_path, screenshot_path, censoring_horizon
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(observation_id) DO UPDATE SET
                    status=excluded.status,
                    html_sha256=excluded.html_sha256,
                    screenshot_sha256=excluded.screenshot_sha256,
                    html_path=excluded.html_path,
                    screenshot_path=excluded.screenshot_path,
                    censoring_horizon=excluded.censoring_horizon
                """,
                (
                    obs.observation_id,
                    obs.scan_id,
                    obs.point_id,
                    obs.status.value,
                    obs.requested_coordinate[0],
                    obs.requested_coordinate[1],
                    obs.viewport_zoom,
                    obs.search_surface.value,
                    obs.query,
                    obs.timestamp,
                    html_sha256,
                    screenshot_sha256,
                    html_path,
                    screenshot_path,
                    obs.censoring_horizon,
                ),
            )

            # Delete any existing rankings for this observation prior to re-inserting
            conn.execute("DELETE FROM rankings WHERE observation_id = ?", (obs.observation_id,))

            # Insert rankings
            for biz in obs.ranked_businesses:
                conn.execute(
                    """
                    INSERT INTO rankings (
                        observation_id, scan_id, rank, business_name, cid,
                        place_id, address, rating, reviews_count, category, maps_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        obs.observation_id,
                        obs.scan_id,
                        biz.rank,
                        biz.name,
                        biz.cid,
                        biz.place_id,
                        biz.address,
                        biz.rating,
                        biz.reviews_count,
                        biz.category,
                        biz.maps_url,
                    ),
                )

    def get_scan_manifest(self, scan_id: str) -> Optional[ScanManifest]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM scans WHERE scan_id = ?", (scan_id,)).fetchone()
            if not row:
                return None
            return ScanManifest(
                scan_id=row["scan_id"],
                profile_id=row["profile_id"],
                query_string=row["query_string"],
                target_surface=SearchSurface(row["target_surface"]),
                frame_type=FrameType(row["frame_type"]),
                status=ScanStatus(row["status"]),
                start_time=row["start_time"],
                end_time=row["end_time"],
                total_points=row["total_points"],
                completed_points=row["completed_points"],
                failed_points=row["failed_points"],
                manifest_sha256=row["manifest_sha256"],
                point_ids=json.loads(row["point_ids_json"]) if row["point_ids_json"] else [],
            )

    def get_rankings_by_cid(self, scan_id: str, cid: str) -> List[Dict[str, Any]]:
        """
        Queries all observations within a scan where a specific business CID ranked.
        """
        with self._get_connection() as conn:
            rows = conn.execute(
                """
                SELECT r.rank, r.business_name, r.cid, o.point_id, o.latitude, o.longitude
                FROM rankings r
                JOIN observations o ON r.observation_id = o.observation_id
                WHERE r.scan_id = ? AND r.cid = ?
                ORDER BY r.rank ASC
                """,
                (scan_id, cid),
            ).fetchall()
            return [dict(r) for r in rows]

    def get_scan_summary(self, scan_id: str) -> Dict[str, Any]:
        with self._get_connection() as conn:
            scan = conn.execute("SELECT * FROM scans WHERE scan_id = ?", (scan_id,)).fetchone()
            if not scan:
                return {}
            obs_counts = conn.execute(
                "SELECT status, COUNT(*) as count FROM observations WHERE scan_id = ? GROUP BY status",
                (scan_id,),
            ).fetchall()
            unique_businesses = conn.execute(
                "SELECT COUNT(DISTINCT cid) as unique_cids, COUNT(DISTINCT business_name) as unique_names FROM rankings WHERE scan_id = ?",
                (scan_id,),
            ).fetchone()

            return {
                "scan": dict(scan),
                "status_breakdown": {row["status"]: row["count"] for row in obs_counts},
                "unique_cids": unique_businesses["unique_cids"] if unique_businesses else 0,
                "unique_names": unique_businesses["unique_names"] if unique_businesses else 0,
            }
