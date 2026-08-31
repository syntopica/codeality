"""Build the record of how one stage ended."""

from baseline_py.gate.stage import Stage
from baseline_py.gate.stage_result import StageResult
from baseline_py.gate.stage_status import StageStatus


def build_stage_result(
    stage: Stage, status: StageStatus, exit_code: int, elapsed: float, detail: str
) -> StageResult:
    """Return the stage result with its duration rounded for reporting."""
    return StageResult(
        name=stage.name,
        kind=stage.kind,
        command=stage.command,
        status=status,
        exit_code=exit_code,
        duration_seconds=round(elapsed, 3),
        detail=detail,
    )
