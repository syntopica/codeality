"""Write the baseline atomically and deterministically."""

import json
from pathlib import Path

from baseline_py.baseline.baseline_file import BaselineFile


def write_baseline(path: Path, baseline: BaselineFile) -> None:
    """Write the baseline through a temporary file, sorted for a clean diff."""
    document = {
        "schema_version": baseline.schema_version,
        "tool_version": baseline.tool_version,
        "entries": sorted(baseline.entries),
    }
    temporary = path.with_suffix(f"{path.suffix}.tmp")
    temporary.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)
