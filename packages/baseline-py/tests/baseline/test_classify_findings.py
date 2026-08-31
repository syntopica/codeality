"""A baseline records debt by identity, not by line number."""

from pathlib import Path

import pytest

from baseline_py.baseline.baseline_file import BaselineFile
from baseline_py.baseline.classify_findings import classify_findings
from baseline_py.baseline.fingerprint import fingerprint
from baseline_py.baseline.read_baseline import read_baseline
from baseline_py.baseline.write_baseline import write_baseline
from baseline_py.config.config_error import ConfigError
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity


def _finding(line: int, subject: str = "Parser", path: str = "src/a.py") -> Finding:
    finding = Finding(
        code=RuleCode.BPY001,
        severity=Severity.ERROR,
        message="message",
        location=Location(path=path, line=line, column=1),
        subject=subject,
    )
    return Finding(
        code=finding.code,
        severity=finding.severity,
        message=finding.message,
        location=finding.location,
        subject=finding.subject,
        fingerprint=fingerprint(finding, "context"),
    )


def test_inserting_a_line_does_not_make_a_finding_new() -> None:
    assert _finding(1).fingerprint == _finding(40).fingerprint


def test_a_different_subject_is_a_different_finding() -> None:
    assert _finding(1).fingerprint != _finding(1, "Writer").fingerprint


def test_a_different_file_is_a_different_finding() -> None:
    assert _finding(1).fingerprint != _finding(1, path="src/b.py").fingerprint


def test_a_recorded_finding_is_known_and_a_fresh_one_is_new() -> None:
    recorded = _finding(1)
    fresh = _finding(1, "Writer")
    baseline = BaselineFile(entries=frozenset({recorded.fingerprint}))
    classified = classify_findings((recorded, fresh), baseline)
    assert classified.known == (recorded,)
    assert classified.new == (fresh,)


def test_a_baseline_entry_without_a_current_finding_is_resolved() -> None:
    baseline = BaselineFile(entries=frozenset({"deadbeefdeadbeef"}))
    assert classify_findings((), baseline).resolved == ("deadbeefdeadbeef",)


def test_a_baseline_round_trips(tmp_path: Path) -> None:
    path = tmp_path / "baseline.json"
    write_baseline(
        path, BaselineFile(entries=frozenset({"b", "a"}), tool_version="0.1.0")
    )
    assert read_baseline(path).entries == frozenset({"a", "b"})
    assert '"a",\n    "b"' in path.read_text(encoding="utf-8")


def test_an_incompatible_schema_version_is_fatal(tmp_path: Path) -> None:
    path = tmp_path / "baseline.json"
    path.write_text('{"schema_version": 99, "entries": []}', encoding="utf-8")
    with pytest.raises(ConfigError, match="schema_version"):
        read_baseline(path)


def test_a_missing_baseline_reads_as_empty(tmp_path: Path) -> None:
    assert read_baseline(tmp_path / "absent.json").entries == frozenset()
