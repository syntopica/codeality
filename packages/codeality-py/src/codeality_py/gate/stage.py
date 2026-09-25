"""One command the gate runs."""

from dataclasses import dataclass

from codeality_py.gate.stage_kind import StageKind


@dataclass(frozen=True, slots=True)
class Stage:
    """A named command, and whether the gate may proceed without it."""

    name: str
    kind: StageKind
    command: tuple[str, ...]
    # Seconds the stage may take and still pass. Zero means unbudgeted.
    budget_seconds: float = 0.0
    # Where the budget came from, so a report can say which one applied.
    budget_source: str = ""
