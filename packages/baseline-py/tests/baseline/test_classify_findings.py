"""A baseline records debt by identity, not by line number."""

from pathlib import Path

import pytest

from baseline_py.baseline.baseline_file import BaselineFile
from baseline_py.baseline.classify_findings import classify_findings
from baseline_py.baseline.read_baseline import read_baseline
from baseline_py.baseline.write_baseline import write_baseline
from baseline_py.config.config_error import ConfigError
from baseline_py.engine.fingerprint_findings import fingerprint_findings
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity

_TEXT = 'QUERY_A = "SELECT id FROM users"\nQUERY_B = "SELECT name FROM albums"\n'


def _finding(code: RuleCode, line: int, subject: str | None, path: str = "src/a.py") -> Finding:
    return Finding(
        code=code,
        severity=Severity.ERROR,
        message="message",
        location=Location(path=path, line=line, column=1),
        subject=subject,
    )


def _prints(findings: tuple[Finding, ...], text: str = _TEXT) -> list[str]:
    return [f.fingerprint for f in fingerprint_findings(findings, text)]


def test_two_queries_in_one_file_get_different_fingerprints() -> None:
    findings = (
        _finding(RuleCode.BPY006, 1, "select"),
        _finding(RuleCode.BPY006, 2, "select"),
    )
    assert len(set(_prints(findings))) == 2


def test_identical_lines_are_still_told_apart() -> None:
    text = 'q("SELECT id FROM users")\nq("SELECT id FROM users")\n'
    findings = (
        _finding(RuleCode.BPY006, 1, "select"),
        _finding(RuleCode.BPY006, 2, "select"),
    )
    assert len(set(_prints(findings, text))) == 2


def test_a_query_keeps_its_fingerprint_when_a_line_is_inserted_above() -> None:
    before = _prints((_finding(RuleCode.BPY006, 1, "select"),))
    shifted = "# a new comment\n" + _TEXT
    after = _prints((_finding(RuleCode.BPY006, 2, "select"),), shifted)
    assert before == after


def test_a_file_level_finding_survives_an_edit_to_its_first_line() -> None:
    before = _prints((_finding(RuleCode.BPY001, 1, "Parser"),))
    after = _prints((_finding(RuleCode.BPY001, 1, "Writer"),), "# changed\n" + _TEXT)
    assert before == after


def test_a_naming_finding_is_identified_by_its_symbol() -> None:
    one = _prints((_finding(RuleCode.BPY002, 4, "Parser"),))
    other = _prints((_finding(RuleCode.BPY002, 9, "Writer"),))
    assert one != other


def test_a_different_file_is_a_different_finding() -> None:
    here = _prints((_finding(RuleCode.BPY006, 1, "select"),))
    there = _prints((_finding(RuleCode.BPY006, 1, "select", "src/b.py"),))
    assert here != there


def test_a_recorded_finding_is_known_and_a_fresh_one_is_new() -> None:
    findings = fingerprint_findings(
        (
            _finding(RuleCode.BPY006, 1, "select"),
            _finding(RuleCode.BPY006, 2, "select"),
        ),
        _TEXT,
    )
    baseline = BaselineFile(entries=frozenset({findings[0].fingerprint}))
    classified = classify_findings(findings, baseline)
    assert classified.known == (findings[0],)
    assert classified.new == (findings[1],)


def test_a_baseline_entry_without_a_current_finding_is_resolved() -> None:
    baseline = BaselineFile(entries=frozenset({"deadbeefdeadbeef"}))
    assert classify_findings((), baseline).resolved == ("deadbeefdeadbeef",)


def test_a_baseline_round_trips(tmp_path: Path) -> None:
    path = tmp_path / "baseline.json"
    write_baseline(path, BaselineFile(entries=frozenset({"b", "a"}), tool_version="0.1.1"))
    assert read_baseline(path).entries == frozenset({"a", "b"})
    assert '"a",\n    "b"' in path.read_text(encoding="utf-8")


def test_an_incompatible_schema_version_is_fatal(tmp_path: Path) -> None:
    path = tmp_path / "baseline.json"
    path.write_text('{"schema_version": 99, "entries": []}', encoding="utf-8")
    with pytest.raises(ConfigError, match="schema_version"):
        read_baseline(path)


def test_a_missing_baseline_reads_as_empty(tmp_path: Path) -> None:
    assert read_baseline(tmp_path / "absent.json").entries == frozenset()
