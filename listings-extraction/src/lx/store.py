"""
Run state. Every target's outcome is written the moment it is known — SQLite row plus one
JSONL line, flushed — so a run that dies keeps everything it finished, and a restart skips
it. Nothing is held in memory for a final write.

  output/<run>/lx.sqlite          targets (status, attempts, evidence paths) + results
  output/<run>/results.jsonl      one line per extracted row, appended as it happens
  output/<run>/artifacts/<id>/    page.html, page.png, final_url.txt (or viewport.* for searches)
"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from lx.targets import Target

SCHEMA = """
CREATE TABLE IF NOT EXISTS targets (
  target_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  spec TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | done | failed | blocked
  attempts INTEGER NOT NULL DEFAULT 0,
  entry_path TEXT,
  html_path TEXT,
  screenshot_path TEXT,
  final_url TEXT,
  page_kind TEXT,
  last_error TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS results (
  target_id TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  data TEXT NOT NULL,
  extracted_at TEXT NOT NULL,
  PRIMARY KEY (target_id, row_index)
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class RunStore:
    def __init__(self, run_dir: Path):
        self.dir = run_dir
        self.dir.mkdir(parents=True, exist_ok=True)
        self.artifacts = self.dir / "artifacts"
        self.artifacts.mkdir(exist_ok=True)
        self.db = sqlite3.connect(self.dir / "lx.sqlite")
        self.db.executescript(SCHEMA)
        self.jsonl = (self.dir / "results.jsonl").open("a", encoding="utf-8")

    def close(self) -> None:
        self.jsonl.close()
        self.db.close()

    def enqueue(self, targets: Iterable[Target]) -> int:
        n = 0
        for t in targets:
            cur = self.db.execute(
                "INSERT OR IGNORE INTO targets (target_id, kind, spec, updated_at) VALUES (?,?,?,?)",
                (t.target_id, t.kind, json.dumps(t.to_dict()), now()),
            )
            n += cur.rowcount
        self.db.commit()
        return n

    def status(self, target_id: str) -> Optional[str]:
        row = self.db.execute("SELECT status FROM targets WHERE target_id=?", (target_id,)).fetchone()
        return row[0] if row else None

    def mark(self, target_id: str, status: str, **fields: Any) -> None:
        sets = ["status=?", "updated_at=?"] + [f"{k}=?" for k in fields]
        self.db.execute(
            f"UPDATE targets SET {', '.join(sets)}, attempts=attempts+? WHERE target_id=?",
            (status, now(), *fields.values(), 1 if status in ("done", "failed", "blocked") else 0, target_id),
        )
        self.db.commit()

    def save_rows(self, target_id: str, rows: List[Dict[str, Any]]) -> None:
        ts = now()
        self.db.execute("DELETE FROM results WHERE target_id=?", (target_id,))
        for i, r in enumerate(rows):
            self.db.execute("INSERT INTO results VALUES (?,?,?,?)", (target_id, i, json.dumps(r), ts))
            self.jsonl.write(json.dumps({"target_id": target_id, "row_index": i, "extracted_at": ts, **r}) + "\n")
        self.db.commit()
        self.jsonl.flush()

    def evidence(self) -> List[Dict[str, Any]]:
        cols = ["target_id", "kind", "spec", "status", "html_path", "final_url", "page_kind"]
        q = f"SELECT {', '.join(cols)} FROM targets WHERE html_path IS NOT NULL AND html_path != ''"
        return [dict(zip(cols, r)) for r in self.db.execute(q)]

    def all_rows(self) -> List[Dict[str, Any]]:
        q = "SELECT r.target_id, r.row_index, r.data, t.kind, t.spec FROM results r JOIN targets t USING (target_id) ORDER BY r.target_id, r.row_index"
        return [
            {"target_id": tid, "row_index": i, "kind": kind, "input": json.loads(spec), **json.loads(data)}
            for tid, i, data, kind, spec in self.db.execute(q)
        ]

    def counts(self) -> Dict[str, int]:
        return dict(self.db.execute("SELECT status, COUNT(*) FROM targets GROUP BY status").fetchall())
