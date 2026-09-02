"""A green gate has to mean the gate actually ran."""

from pathlib import Path

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.gate.gate_result import GateResult
from baseline_py.gate.run_gate import run_gate
from baseline_py.gate.run_stage import run_stage
from baseline_py.gate.stage import Stage
from baseline_py.gate.stage_kind import StageKind
from baseline_py.gate.stage_result import StageResult
from baseline_py.gate.stage_status import StageStatus
from baseline_py.report.exit_code import ExitCode


def _stage_result(kind: StageKind, status: StageStatus) -> StageResult:
    return StageResult(
        name="stage",
        kind=kind,
        command=("true",),
        status=status,
        exit_code=0,
        duration_seconds=0.0,
    )


def test_a_missing_required_tool_is_failed_to_run(tmp_path: Path) -> None:
    stage = Stage("absent", StageKind.REQUIRED, ("baseline-py-no-such-tool",))
    result = run_stage(stage, tmp_path)
    assert result.status is StageStatus.FAILED_TO_RUN
    assert result.exit_code == 127


def test_a_missing_required_tool_exits_3_not_0() -> None:
    result = GateResult(stages=(_stage_result(StageKind.REQUIRED, StageStatus.FAILED_TO_RUN),))
    assert result.exit_code() is ExitCode.INFRASTRUCTURE


def test_a_missing_shadow_tool_does_not_fail_the_gate() -> None:
    result = GateResult(stages=(_stage_result(StageKind.SHADOW, StageStatus.FAILED_TO_RUN),))
    assert result.exit_code() is ExitCode.OK


def test_findings_in_a_required_stage_exit_1() -> None:
    result = GateResult(stages=(_stage_result(StageKind.REQUIRED, StageStatus.FINDINGS),))
    assert result.exit_code() is ExitCode.FINDINGS


def test_infrastructure_outranks_findings() -> None:
    result = GateResult(
        stages=(
            _stage_result(StageKind.REQUIRED, StageStatus.FINDINGS),
            _stage_result(StageKind.REQUIRED, StageStatus.FAILED_TO_RUN),
        )
    )
    assert result.exit_code() is ExitCode.INFRASTRUCTURE


def test_a_passing_stage_records_its_duration(tmp_path: Path) -> None:
    result = run_stage(Stage("true", StageKind.REQUIRED, ("true",)), tmp_path)
    assert result.status is StageStatus.PASSED
    assert result.duration_seconds >= 0.0


def test_every_stage_runs_by_default(tmp_path: Path) -> None:
    config = BaselineConfig(project_root=tmp_path)
    result = run_gate(config, fail_fast=False)
    assert len(result.stages) == 8


def test_fail_fast_stops_at_the_first_blocking_failure(tmp_path: Path) -> None:
    config = BaselineConfig(project_root=tmp_path)
    result = run_gate(config, fail_fast=True)
    assert len(result.stages) < 8


def test_a_failing_stage_keeps_what_it_wrote_to_stderr(tmp_path: Path) -> None:
    script = tmp_path / "noisy.sh"
    script.write_text("#!/bin/sh\necho found on stdout\necho found on stderr >&2\nexit 1\n")
    script.chmod(0o755)
    stage = Stage("noisy", StageKind.REQUIRED, (str(script),))
    result = run_stage(stage, tmp_path)
    assert result.status is StageStatus.FINDINGS
    assert "found on stdout" in result.detail
    assert "found on stderr" in result.detail
