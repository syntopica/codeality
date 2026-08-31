"""What one gate run produced."""

from dataclasses import dataclass

from baseline_py.gate.stage_result import StageResult
from baseline_py.gate.stage_status import StageStatus
from baseline_py.report.exit_code import ExitCode


@dataclass(frozen=True, slots=True)
class GateResult:
    """Every stage result, and the single exit code they imply."""

    stages: tuple[StageResult, ...]

    def exit_code(self) -> ExitCode:
        """Return the highest-priority outcome. A skipped tool is never OK."""
        blocking = [stage for stage in self.stages if stage.kind.value == "required"]
        if any(stage.status is StageStatus.FAILED_TO_RUN for stage in blocking):
            return ExitCode.INFRASTRUCTURE
        if any(stage.status is StageStatus.FINDINGS for stage in blocking):
            return ExitCode.FINDINGS
        return ExitCode.OK
