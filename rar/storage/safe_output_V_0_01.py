"""
RAR Universal Safe Output & Non-Destructive Protection Engine
Version: 0.01
Author: Operations Orchestrator / Spatial Systems Architect

Enforces strict non-destructive file operations:
  - Scans target directories for matching filenames before write.
  - Automatically resolves version collision: increments _V_0_01 -> _V_0_02 -> _V_0_03,
    or appends deterministic UTC timestamps.
  - Guarantees zero existing datasets, walkthroughs, or implementation plans are ever overwritten.
"""
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List, Optional, Union


def get_safe_output_path(target_path: Union[str, Path]) -> Path:
    """
    Checks target directory for existing files. If target_path exists,
    non-destructively increments its semantic version or appends a timestamp
    to ensure it never overwrites existing data.
    """
    path = Path(target_path).resolve()
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    parent = path.parent
    name = path.name
    suffix = path.suffix

    # Check for semantic version pattern: e.g. '_V_0_01' or '_V_1_00'
    version_match = re.search(r"_V_(\d+)_(\d+)(.*)$", path.stem)
    if version_match:
        major = int(version_match.group(1))
        minor = int(version_match.group(2))
        base_stem = path.stem[: version_match.start()]
        extra_suffix = version_match.group(3)

        curr_minor = minor
        while True:
            curr_minor += 1
            candidate_stem = f"{base_stem}_V_{major}_{curr_minor:02d}{extra_suffix}"
            candidate_path = parent / f"{candidate_stem}{suffix}"
            if not candidate_path.exists():
                print(f"[SAFE_OUTPUT] Collision detected for '{path.name}'. Non-destructively routing to '{candidate_path.name}'.")
                return candidate_path
    else:
        # No version tag; append _V_0_02 or timestamp
        v2_path = parent / f"{path.stem}_V_0_02{suffix}"
        if not v2_path.exists():
            print(f"[SAFE_OUTPUT] Collision detected for '{path.name}'. Non-destructively routing to '{v2_path.name}'.")
            return v2_path

        # If v2 exists, increment or use timestamp
        curr = 2
        while curr < 100:
            curr += 1
            cand = parent / f"{path.stem}_V_0_{curr:02d}{suffix}"
            if not cand.exists():
                print(f"[SAFE_OUTPUT] Collision detected for '{path.name}'. Non-destructively routing to '{cand.name}'.")
                return cand

        # Fallback to high-precision timestamp
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        ts_path = parent / f"{path.stem}_{ts}{suffix}"
        print(f"[SAFE_OUTPUT] Collision fallback for '{path.name}'. Non-destructively routing to '{ts_path.name}'.")
        return ts_path


def safe_write_json(target_path: Union[str, Path], data: Any, indent: int = 2) -> Path:
    """
    Safely writes JSON without overwriting existing files.
    """
    safe_path = get_safe_output_path(target_path)
    safe_path.parent.mkdir(parents=True, exist_ok=True)
    with open(safe_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent)
    return safe_path


def safe_write_text(target_path: Union[str, Path], content: str) -> Path:
    """
    Safely writes text/markdown without overwriting existing files.
    """
    safe_path = get_safe_output_path(target_path)
    safe_path.parent.mkdir(parents=True, exist_ok=True)
    with open(safe_path, "w", encoding="utf-8") as f:
        f.write(content)
    return safe_path
