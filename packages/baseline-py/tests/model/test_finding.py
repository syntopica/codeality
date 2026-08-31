"""Findings sort deterministically for golden output."""

from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity


def _finding(path: str, line: int, code: RuleCode) -> Finding:
    return Finding(
        code=code,
        severity=Severity.ERROR,
        message="message",
        location=Location(path=path, line=line, column=1),
    )


def test_findings_are_ordered_by_path_then_location_then_code() -> None:
    first = _finding("a.py", 1, RuleCode.BPY004)
    second = _finding("b.py", 1, RuleCode.BPY001)
    assert sorted([second, first]) == [first, second]


def test_same_path_orders_by_line_then_code() -> None:
    early = _finding("a.py", 1, RuleCode.BPY004)
    late = _finding("a.py", 9, RuleCode.BPY001)
    assert sorted([late, early]) == [early, late]
