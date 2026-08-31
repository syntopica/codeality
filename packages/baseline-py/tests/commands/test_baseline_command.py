"""The baseline group is the only thing that writes recorded debt."""

from pathlib import Path

from click.testing import CliRunner

from baseline_py.baseline.baseline_file import BASELINE_FILENAME
from baseline_py.cli import cli

_TWO_UNITS = "class A:\n    pass\n\n\nclass B:\n    pass\n"


def _project(tmp_path: Path, body: str) -> Path:
    source = tmp_path / "src" / "pkg"
    source.mkdir(parents=True)
    (source / "__init__.py").write_text('"""Package."""\n', encoding="utf-8")
    (source / "unit.py").write_text(body, encoding="utf-8")
    return tmp_path


def _invoke(*args: str):
    return CliRunner().invoke(cli, list(args))


def test_update_records_current_findings_and_check_then_passes(tmp_path: Path) -> None:
    project = _project(tmp_path, _TWO_UNITS)
    assert _invoke("baseline", "update", "--project", str(project)).exit_code == 0
    assert (project / BASELINE_FILENAME).is_file()
    result = _invoke("baseline", "check", "--project", str(project))
    assert result.exit_code == 0
    assert "0 new" in result.output


def test_a_new_finding_after_a_baseline_fails(tmp_path: Path) -> None:
    project = _project(tmp_path, _TWO_UNITS)
    _invoke("baseline", "update", "--project", str(project))
    (project / "src" / "pkg" / "other.py").write_text(_TWO_UNITS, encoding="utf-8")
    result = _invoke("baseline", "check", "--project", str(project))
    assert result.exit_code == 1
    assert "1 new" in result.output


def test_editing_a_file_does_not_forgive_its_recorded_findings(tmp_path: Path) -> None:
    project = _project(tmp_path, _TWO_UNITS)
    _invoke("baseline", "update", "--project", str(project))
    unit = project / "src" / "pkg" / "unit.py"
    unit.write_text("# a new comment\n" + _TWO_UNITS, encoding="utf-8")
    result = _invoke("baseline", "check", "--project", str(project))
    assert "0 new, 1 known" in result.output


def test_stale_debt_is_reported_and_can_fail(tmp_path: Path) -> None:
    project = _project(tmp_path, _TWO_UNITS)
    _invoke("baseline", "update", "--project", str(project))
    unit = project / "src" / "pkg" / "unit.py"
    unit.write_text("class Unit:\n    pass\n", encoding="utf-8")
    result = _invoke("baseline", "check", "--project", str(project))
    assert "1 resolved" in result.output
    assert result.exit_code == 0
    strict = _invoke("baseline", "check", "--project", str(project), "--check-stale")
    assert strict.exit_code == 1


def test_check_does_not_write_a_baseline(tmp_path: Path) -> None:
    project = _project(tmp_path, _TWO_UNITS)
    _invoke("check", "--project", str(project))
    assert not (project / BASELINE_FILENAME).exists()
