"""What running one stage produced."""

from dataclasses import dataclass

from baseline_py.gate.stage_kind import StageKind
from baseline_py.gate.stage_status import StageStatus


@dataclass(frozen=True, slots=True)
class StageResult:
    """A stage's outcome, kept distinguishable from every other outcome."""

    name: str
    kind: StageKind
    command: tuple[str, ...]
    status: StageStatus
    exit_code: int
    duration_seconds: float
    detail: str = ""
