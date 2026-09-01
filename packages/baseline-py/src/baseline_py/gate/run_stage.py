"""Run one stage and classify how it ended."""

import shutil
import subprocess
import time
from pathlib import Path

from baseline_py.gate.build_stage_result import build_stage_result
from baseline_py.gate.stage import Stage
from baseline_py.gate.stage_kind import StageKind
from baseline_py.gate.stage_result import StageResult
from baseline_py.gate.stage_status import StageStatus


def run_stage(stage: Stage, project_root: Path) -> StageResult:
    """Return the stage result.

    A required tool that is not installed is FAILED_TO_RUN, not a skip: a
    gate that silently omits a check and still reports success is worse than
    no gate. A missing shadow tool is different - it is advisory by design
    and optional to install, so its absence is a skip, not an alarm.
    """
    executable = shutil.which(stage.command[0])
    if executable is None:
        if stage.kind is StageKind.SHADOW:
            return build_stage_result(
                stage,
                StageStatus.SKIPPED_NOT_APPLICABLE,
                0,
                0.0,
                "not installed; shadow stages are optional",
            )
        return build_stage_result(
            stage, StageStatus.FAILED_TO_RUN, 127, 0.0, "executable not found"
        )
    started = time.monotonic()
    completed = subprocess.run(
        (executable, *stage.command[1:]),
        cwd=project_root,
        capture_output=True,
        text=True,
        check=False,
    )
    elapsed = time.monotonic() - started
    status = StageStatus.PASSED if completed.returncode == 0 else StageStatus.FINDINGS
    detail = "" if completed.returncode == 0 else completed.stdout.strip()[-2000:]
    return build_stage_result(stage, status, completed.returncode, elapsed, detail)
