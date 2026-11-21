"""
Content-Addressed Raw Evidence Storage Engine
Saves HTML DOM and PNG screenshots immutably with SHA-256 integrity verification.
"""
import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from rar.schemas.data_models_V_0_01 import RawArtifactReference


class ArtifactStorageEngine:
    """
    Manages immutable, content-addressed storage for raw observation evidence.
    """
    def __init__(self, base_directory: str = "artifacts"):
        self.base_dir = Path(base_directory)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def store_artifacts(
        self,
        scan_id: str,
        point_id: str,
        html_content: str,
        screenshot_bytes: Optional[bytes] = None,
    ) -> RawArtifactReference:
        """
        Computes SHA-256 hashes, persists HTML and optional PNG, and returns a verified reference.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Hash HTML
        html_bytes = html_content.encode("utf-8")
        html_sha256 = hashlib.sha256(html_bytes).hexdigest()
        
        # Scan-specific directory
        scan_dir = self.base_dir / scan_id
        scan_dir.mkdir(parents=True, exist_ok=True)
        
        # Save HTML
        html_filename = f"{point_id}_{html_sha256[:12]}.html"
        html_path = scan_dir / html_filename
        if not html_path.exists():
            with open(html_path, "wb") as f:
                f.write(html_bytes)
                
        # Optional Screenshot
        screenshot_sha256 = None
        screenshot_path_str = None
        if screenshot_bytes:
            screenshot_sha256 = hashlib.sha256(screenshot_bytes).hexdigest()
            screenshot_filename = f"{point_id}_{screenshot_sha256[:12]}.png"
            screenshot_path = scan_dir / screenshot_filename
            if not screenshot_path.exists():
                with open(screenshot_path, "wb") as f:
                    f.write(screenshot_bytes)
            screenshot_path_str = str(screenshot_path.resolve())

        return RawArtifactReference(
            html_sha256=html_sha256,
            html_path=str(html_path.resolve()),
            screenshot_sha256=screenshot_sha256,
            screenshot_path=screenshot_path_str,
            timestamp=timestamp,
        )

    @staticmethod
    def verify_artifact(ref: RawArtifactReference) -> bool:
        """
        Cryptographically verifies that the file on disk matches the recorded SHA-256 hash.
        """
        html_path = Path(ref.html_path)
        if not html_path.exists():
            return False
        
        with open(html_path, "rb") as f:
            computed_html_hash = hashlib.sha256(f.read()).hexdigest()
        if computed_html_hash != ref.html_sha256:
            return False

        if ref.screenshot_path and ref.screenshot_sha256:
            ss_path = Path(ref.screenshot_path)
            if not ss_path.exists():
                return False
            with open(ss_path, "rb") as f:
                computed_ss_hash = hashlib.sha256(f.read()).hexdigest()
            if computed_ss_hash != ref.screenshot_sha256:
                return False

        return True
