"""One command the gate runs."""

from dataclasses import dataclass

from baseline_py.gate.stage_kind import StageKind


@dataclass(frozen=True, slots=True)
class Stage:
    """A named command, and whether the gate may proceed without it."""

    name: str
    kind: StageKind
    command: tuple[str, ...]
