"""Run every stage and combine the outcomes."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.gate.gate_result import GateResult
from baseline_py.gate.gate_stages import gate_stages
from baseline_py.gate.run_stage import run_stage
from baseline_py.gate.stage_kind import StageKind
from baseline_py.gate.stage_status import StageStatus

_BLOCKED = (StageStatus.FINDINGS, StageStatus.FAILED_TO_RUN)


def run_gate(config: BaselineConfig, fail_fast: bool) -> GateResult:
    """Run the stages, all of them by default.

    Running every stage is what makes an adoption pass useful: stopping at the
    first failure means the same tool is fixed over and over and the rest of
    the picture never appears.
    """
    results = []
    for stage in gate_stages(config):
        result = run_stage(stage, config.project_root)
        results.append(result)
        blocking = stage.kind is StageKind.REQUIRED and result.status in _BLOCKED
        if fail_fast and blocking:
            break
    return GateResult(stages=tuple(results))
