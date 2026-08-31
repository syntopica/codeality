"""Read the recorded baseline, refusing an incompatible one."""

import json
from pathlib import Path

from baseline_py.baseline.baseline_file import BASELINE_SCHEMA_VERSION, BaselineFile
from baseline_py.config.config_error import ConfigError


def read_baseline(path: Path) -> BaselineFile:
    """Return the baseline, or an empty one when the file is absent.

    An incompatible schema is a configuration error rather than a silent
    reclassification of every finding as new or known.
    """
    if not path.is_file():
        return BaselineFile()
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ConfigError(f"{path.name} could not be read: {error}") from error
    version = document.get("schema_version")
    if version != BASELINE_SCHEMA_VERSION:
        raise ConfigError(
            f"baseline schema_version must be {BASELINE_SCHEMA_VERSION}, found {version!r}; "
            "run 'baseline-py baseline update' to rewrite it"
        )
    return BaselineFile(
        entries=frozenset(document.get("entries", ())),
        schema_version=version,
        tool_version=document.get("tool_version", ""),
    )
