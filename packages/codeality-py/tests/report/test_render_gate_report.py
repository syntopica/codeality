"""The report says which suite budget applied, in both of its forms."""

import json

from codeality_py.gate.gate_result import GateResult
from codeality_py.gate.stage_kind import StageKind
from codeality_py.gate.stage_result import StageResult
from codeality_py.gate.stage_status import StageStatus
from codeality_py.report.render_gate_report import render_gate_report


def _result(budget_seconds: float, budget_source: str) -> GateResult:
    stage = StageResult(
        name="pytest",
        kind=StageKind.REQUIRED,
        command=("pytest",),
        status=StageStatus.PASSED,
        exit_code=0,
        duration_seconds=292.0,
        budget_seconds=budget_seconds,
        budget_source=budget_source,
    )
    return GateResult(stages=(stage,))


def test_the_json_names_the_budget_and_its_source() -> None:
    report = render_gate_report(_result(600.0, "CODEALITY_PY_TEST_BUDGET_SECONDS"), as_json=True)
    stage = json.loads(report)["stages"][0]
    assert stage["budget_seconds"] == 600.0
    assert stage["budget_source"] == "CODEALITY_PY_TEST_BUDGET_SECONDS"


def test_the_json_marks_an_unbudgeted_stage_with_nulls() -> None:
    stage = json.loads(render_gate_report(_result(0.0, ""), as_json=True))["stages"][0]
    assert stage["budget_seconds"] is None
    assert stage["budget_source"] is None


def test_the_text_line_names_the_budget_and_its_source() -> None:
    report = render_gate_report(_result(600.0, "CODEALITY_PY_TEST_BUDGET_SECONDS"), as_json=False)
    assert report.endswith("[budget 600s from CODEALITY_PY_TEST_BUDGET_SECONDS]")


def test_the_text_line_of_an_unbudgeted_stage_is_unchanged() -> None:
    assert "budget" not in render_gate_report(_result(0.0, ""), as_json=False)
