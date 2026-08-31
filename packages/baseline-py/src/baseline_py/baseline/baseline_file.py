"""The recorded debt of one project."""

from dataclasses import dataclass, field

BASELINE_SCHEMA_VERSION = 1
BASELINE_FILENAME = ".baseline-py-baseline.json"


@dataclass(frozen=True, slots=True)
class BaselineFile:
    """Fingerprints of the findings a project has agreed to carry."""

    entries: frozenset[str] = field(default_factory=frozenset)
    schema_version: int = BASELINE_SCHEMA_VERSION
    tool_version: str = ""
