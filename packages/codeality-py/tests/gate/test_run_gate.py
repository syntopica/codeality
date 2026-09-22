"""A green gate has to mean the gate actually ran."""

from pathlib import Path

from codeality_py.config.baseline_config import BaselineConfig
from codeality_py.gate.gate_result import GateResult
from codeality_py.gate.run_gate import run_gate
from codeality_py.gate.run_stage import run_stage
from codeality_py.gate.stage import Stage
from codeality_py.gate.stage_kind import StageKind
from codeality_py.gate.stage_result import StageResult
from codeality_py.gate.stage_status import StageStatus
from codeality_py.report.exit_code import ExitCode


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
    stage = Stage("absent", StageKind.REQUIRED, ("codeality-py-no-such-tool",))
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


def test_a_passing_stage_past_its_budget_is_over_budget(tmp_path: Path) -> None:
    """2026-09-22: a consumer's suite had grown to 31 minutes and every gate
    was green, because a slow suite was not a finding. One profiling pass
    found that a checker re-parsed the same file 620 951 times per run and
    took it to four minutes; parallel workers took it to 32 seconds. The
    gate has to be what says the number is too big.
    """
    stage = Stage("sleep", StageKind.REQUIRED, ("sleep", "0.2"), budget_seconds=0.05)
    result = run_stage(stage, tmp_path)
    assert result.status is StageStatus.OVER_BUDGET
    assert result.exit_code == 0
    assert "over its budget of 0.05s" in result.detail
    assert "testing.md#suite-time-budget" in result.detail


def test_an_unbudgeted_stage_passes_however_long_it_takes(tmp_path: Path) -> None:
    result = run_stage(Stage("sleep", StageKind.REQUIRED, ("sleep", "0.05")), tmp_path)
    assert result.status is StageStatus.PASSED


def test_a_failing_stage_past_its_budget_reports_the_failure(tmp_path: Path) -> None:
    stage = Stage("false", StageKind.REQUIRED, ("false",), budget_seconds=0.000001)
    assert run_stage(stage, tmp_path).status is StageStatus.FINDINGS


def test_over_budget_in_a_required_stage_exits_1() -> None:
    result = GateResult(stages=(_stage_result(StageKind.REQUIRED, StageStatus.OVER_BUDGET),))
    assert result.exit_code() is ExitCode.FINDINGS


def test_over_budget_in_a_shadow_stage_does_not_fail_the_gate() -> None:
    result = GateResult(stages=(_stage_result(StageKind.SHADOW, StageStatus.OVER_BUDGET),))
    assert result.exit_code() is ExitCode.OK
