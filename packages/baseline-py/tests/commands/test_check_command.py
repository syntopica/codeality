"""check is read-only and maps every failure to its own exit code."""

import json
from pathlib import Path

from click.testing import CliRunner

from baseline_py.cli import cli


def _project(tmp_path: Path, body: str, name: str = "parser.py") -> Path:
    source = tmp_path / "src" / "pkg"
    source.mkdir(parents=True)
    (source / "__init__.py").write_text('"""Package."""\n', encoding="utf-8")
    (source / name).write_text(body, encoding="utf-8")
    return tmp_path


def _run(project: Path, *extra: str):
    return CliRunner().invoke(cli, ["check", "--project", str(project), *extra])


def test_check_exits_0_on_a_clean_tree(tmp_path: Path) -> None:
    project = _project(tmp_path, "class Parser:\n    pass\n")
    result = _run(project)
    assert result.exit_code == 0, result.output


def test_check_exits_1_on_a_violation(tmp_path: Path) -> None:
    project = _project(tmp_path, "class A:\n    pass\n\n\nclass B:\n    pass\n")
    result = _run(project)
    assert result.exit_code == 1
    assert "BPY001" in result.output


def test_check_exits_2_on_a_bad_config(tmp_path: Path) -> None:
    project = _project(tmp_path, "class Parser:\n    pass\n")
    (project / "baseline-py.toml").write_text("schema-version = 99\n", encoding="utf-8")
    result = _run(project)
    assert result.exit_code == 2
    assert "configuration error" in result.output


def test_json_output_is_valid_json(tmp_path: Path) -> None:
    project = _project(tmp_path, "class A:\n    pass\n\n\nclass B:\n    pass\n")
    result = _run(project, "--format", "json")
    document = json.loads(result.output)
    assert document["schema_version"] == 1
    assert document["findings"][0]["code"] == "BPY001"
    assert document["summary"]["total"] == 1


def test_check_never_writes_anything(tmp_path: Path) -> None:
    project = _project(tmp_path, "class A:\n    pass\n\n\nclass B:\n    pass\n")
    before = sorted(path.name for path in project.rglob("*"))
    _run(project)
    assert sorted(path.name for path in project.rglob("*")) == before


def test_a_syntax_error_is_reported_as_bpy000(tmp_path: Path) -> None:
    project = _project(tmp_path, "def broken(\n")
    result = _run(project)
    assert result.exit_code == 1
    assert "BPY000" in result.output


def test_an_inline_suppression_is_honoured(tmp_path: Path) -> None:
    body = 'QUERY = "SELECT id FROM users"  # baseline-py: ignore[BPY006]\n\n\nclass Parser:\n    pass\n'
    project = _project(tmp_path, body)
    result = _run(project)
    assert "BPY006" not in result.output


def test_bpy000_can_never_be_suppressed(tmp_path: Path) -> None:
    marker = "# baseline-py: " + "ignore[BPY000]"
    project = _project(tmp_path, f"def broken(  {marker}\n")
    assert _run(project).exit_code == 1
