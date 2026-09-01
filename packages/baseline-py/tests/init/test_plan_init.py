"""init plans before it writes, and never shadows an existing ruff config."""

from pathlib import Path

from click.testing import CliRunner

from baseline_py.cli import cli
from baseline_py.init.plan_disposition import PlanDisposition
from baseline_py.init.plan_init import plan_init

_PYPROJECT_WITH_RUFF = """\
[project]
name = "demo"
version = "0.1.0"

# The team argued about this one for a week.
[tool.ruff]
line-length = 88

[tool.ruff.lint]
select = ["E", "F"]
ignore = ["E203"]
"""


def _dispositions(plan) -> dict[str, PlanDisposition]:
    return {managed.path.name: managed.disposition for managed in plan}


def test_a_project_with_tool_ruff_gets_a_merge_not_a_create(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(_PYPROJECT_WITH_RUFF, encoding="utf-8")
    plan = plan_init(tmp_path, "lib", with_ci=False)
    assert "ruff.toml" not in _dispositions(plan)
    assert _dispositions(plan)["pyproject.toml"] is PlanDisposition.MERGE


def test_pyproject_is_planned_once_so_neither_merge_is_lost(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(_PYPROJECT_WITH_RUFF, encoding="utf-8")
    plan = plan_init(tmp_path, "lib", with_ci=False)
    entries = [item for item in plan if item.path.name == "pyproject.toml"]
    assert len(entries) == 1
    assert '"RUF"' in entries[0].content
    assert "[tool.deptry]" in entries[0].content


def test_a_project_without_ruff_config_gets_a_standalone_file(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\n', encoding="utf-8"
    )
    plan = plan_init(tmp_path, "lib", with_ci=False)
    assert _dispositions(plan)["ruff.toml"] is PlanDisposition.CREATE


def test_merging_preserves_existing_selects_ignores_and_comments(
    tmp_path: Path,
) -> None:
    (tmp_path / "pyproject.toml").write_text(_PYPROJECT_WITH_RUFF, encoding="utf-8")
    merged = next(
        managed.content
        for managed in plan_init(tmp_path, "lib", with_ci=False)
        if managed.path.name == "pyproject.toml"
    )
    assert "argued about this one for a week" in merged
    assert "line-length = 88" in merged
    assert '"E203"' in merged
    assert '"RUF"' in merged


def test_plan_mode_writes_nothing(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\n', encoding="utf-8"
    )
    before = sorted(path.name for path in tmp_path.iterdir())
    result = CliRunner().invoke(cli, ["init", "--project", str(tmp_path)])
    assert result.exit_code == 0
    assert sorted(path.name for path in tmp_path.iterdir()) == before


def test_check_mode_exits_2_on_conflict(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\n', encoding="utf-8"
    )
    (tmp_path / "mypy.ini").write_text("[mypy]\nstrict = False\n", encoding="utf-8")
    result = CliRunner().invoke(cli, ["init", "--project", str(tmp_path), "--check"])
    assert result.exit_code == 2
    assert "conflict" in result.output


def test_apply_writes_the_planned_files(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\n', encoding="utf-8"
    )
    result = CliRunner().invoke(cli, ["init", "--project", str(tmp_path), "--apply"])
    assert result.exit_code == 0
    assert (tmp_path / "baseline-py.toml").is_file()
    assert (tmp_path / "ruff.toml").is_file()
    assert "[tool.deptry]" in (tmp_path / "pyproject.toml").read_text(encoding="utf-8")


def test_apply_does_not_overwrite_a_conflicting_file(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\n', encoding="utf-8"
    )
    (tmp_path / "mypy.ini").write_text("[mypy]\nstrict = False\n", encoding="utf-8")
    CliRunner().invoke(cli, ["init", "--project", str(tmp_path), "--apply"])
    assert "strict = False" in (tmp_path / "mypy.ini").read_text(encoding="utf-8")


def test_force_replaces_a_conflicting_file(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\n', encoding="utf-8"
    )
    (tmp_path / "mypy.ini").write_text("[mypy]\nstrict = False\n", encoding="utf-8")
    CliRunner().invoke(cli, ["init", "--project", str(tmp_path), "--force"])
    assert "strict = True" in (tmp_path / "mypy.ini").read_text(encoding="utf-8")


def test_init_adds_the_quality_dependency_group(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\n', encoding="utf-8"
    )
    CliRunner().invoke(cli, ["init", "--project", str(tmp_path), "--apply"])
    text = (tmp_path / "pyproject.toml").read_text(encoding="utf-8")
    assert "quality = [" in text
    assert "deptry" in text


def test_the_app_profile_scaffolds_an_import_linter_contract(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[project]\nname = "demo"\n', encoding="utf-8"
    )
    plan = plan_init(tmp_path, "app", with_ci=False)
    assert ".importlinter" in _dispositions(plan)


def test_merging_brings_the_test_ignores_and_docstring_convention(
    tmp_path: Path,
) -> None:
    (tmp_path / "pyproject.toml").write_text(_PYPROJECT_WITH_RUFF, encoding="utf-8")
    merged = next(
        managed.content
        for managed in plan_init(tmp_path, "lib", with_ci=False)
        if managed.path.name == "pyproject.toml"
    )
    assert '"tests/**"' in merged
    assert "[tool.ruff.lint.pydocstyle]" in merged


def test_merging_keeps_the_project_s_own_per_file_ignores(tmp_path: Path) -> None:
    own = (
        _PYPROJECT_WITH_RUFF
        + '\n[tool.ruff.lint.per-file-ignores]\n"tests/**" = ["D"]\n'
    )
    (tmp_path / "pyproject.toml").write_text(own, encoding="utf-8")
    merged = next(
        managed.content
        for managed in plan_init(tmp_path, "lib", with_ci=False)
        if managed.path.name == "pyproject.toml"
    )
    assert '"tests/**" = ["D"]' in merged
