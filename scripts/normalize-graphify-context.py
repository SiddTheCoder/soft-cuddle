#!/usr/bin/env python3
"""Normalize volatile Graphify metadata before committing graphify-out."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


NORMALIZED_COMMIT = "normalized-for-git"


def normalize(root: Path) -> bool:
    graph_dir = root / "graphify-out"
    changed = False

    graph_json = graph_dir / "graph.json"
    if graph_json.exists():
        data = json.loads(graph_json.read_text(encoding="utf-8"))
        if data.get("built_at_commit") != NORMALIZED_COMMIT:
            data["built_at_commit"] = NORMALIZED_COMMIT
            graph_json.write_text(
                json.dumps(data, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
                encoding="utf-8",
            )
            changed = True

    report = graph_dir / "GRAPH_REPORT.md"
    if report.exists():
        text = report.read_text(encoding="utf-8")
        next_text = re.sub(
            r"^- Built from commit: `[^`]*`$",
            f"- Built from commit: `{NORMALIZED_COMMIT}`",
            text,
            flags=re.MULTILINE,
        )
        next_text = next_text.replace(
            "- Run `git rev-parse HEAD` and compare to check if the graph is stale.",
            "- Commit-specific freshness metadata is normalized for stable Git diffs.",
        )
        if next_text != text:
            report.write_text(next_text, encoding="utf-8")
            changed = True

    return changed


if __name__ == "__main__":
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    if normalize(root.resolve()):
        print("[graphify normalize] normalized volatile commit metadata.")
