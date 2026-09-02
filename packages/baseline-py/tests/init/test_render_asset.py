"""init writes what it discovered, not a placeholder to hand-edit."""

from pathlib import Path

from baseline_py.init.plan_init import plan_init
from baseline_py.init.read_asset import read_asset
from baseline_py.init.render_asset import render_asset


def _flat_package_project(tmp_path: Path, name: str) -> Path:
    (tmp_path / "pyproject.toml").write_text(f'[project]\nname = "{name}"\n', encoding="utf-8")
    package = tmp_path / name
    package.mkdir()
    (package / "__init__.py").write_text("", encoding="utf-8")
    return tmp_path


def test_source_roots_are_the_discovered_roots_not_src(tmp_path: Path) -> None:
    project = _flat_package_project(tmp_path, "atrium")
    rendered = render_asset(read_asset("baseline-py.toml"), project)
    assert 'source-roots = ["atrium"]' in rendered


def test_a_src_layout_keeps_the_src_root(tmp_path: Path) -> None:
    (tmp_path / "src" / "pkg").mkdir(parents=True)
    (tmp_path / "src" / "pkg" / "__init__.py").write_text("", encoding="utf-8")
    rendered = render_asset(read_asset("baseline-py.toml"), tmp_path)
    assert 'source-roots = ["src"]' in rendered


def test_known_first_party_is_the_discovered_package(tmp_path: Path) -> None:
    project = _flat_package_project(tmp_path, "atrium")
    merged = next(
        managed.content
        for managed in plan_init(project, "lib", with_ci=False)
        if managed.path.name == "pyproject.toml"
    )
    assert 'known_first_party = ["atrium"]' in merged
    assert "CHANGE_ME" not in merged


def test_the_placeholder_survives_when_nothing_is_discoverable(
    tmp_path: Path,
) -> None:
    rendered = render_asset(read_asset("importlinter.ini"), tmp_path)
    assert "CHANGE_ME" in rendered


def test_the_import_package_is_recorded_for_coverage(tmp_path: Path) -> None:
    project = _flat_package_project(tmp_path, "atrium")
    rendered = render_asset(read_asset("baseline-py.toml"), project)
    assert 'import-package = "atrium"' in rendered


def _project_with_floor(tmp_path: Path, floor: str) -> Path:
    (tmp_path / "pyproject.toml").write_text(
        f'[project]\nname = "demo"\nrequires-python = "{floor}"\n', encoding="utf-8"
    )
    return tmp_path


def test_the_ci_matrix_starts_at_the_requires_python_floor(tmp_path: Path) -> None:
    project = _project_with_floor(tmp_path, ">=3.12")
    rendered = render_asset(read_asset("baseline-py-ci.yml"), project)
    assert "python-version: ['3.12', '3.13']" in rendered


def test_the_ci_matrix_defaults_to_the_lowest_supported_interpreter(tmp_path: Path) -> None:
    rendered = render_asset(read_asset("baseline-py-ci.yml"), tmp_path)
    assert "python-version: ['3.11', '3.13']" in rendered


def test_a_floor_below_the_tool_is_raised_to_the_tool(tmp_path: Path) -> None:
    project = _project_with_floor(tmp_path, ">=3.9")
    rendered = render_asset(read_asset("baseline-py-ci.yml"), project)
    assert "python-version: ['3.11', '3.13']" in rendered


def test_ruff_targets_the_requires_python_floor(tmp_path: Path) -> None:
    project = _project_with_floor(tmp_path, ">=3.12")
    rendered = render_asset(read_asset("ruff.toml"), project)
    assert 'target-version = "py312"' in rendered


def _checked_out(root: Path, branch: str) -> None:
    (root / ".git").mkdir()
    (root / ".git" / "HEAD").write_text(f"ref: refs/heads/{branch}\n", encoding="utf-8")


def test_the_workflow_listens_on_the_checked_out_branch(tmp_path: Path) -> None:
    _checked_out(tmp_path, "master")
    rendered = render_asset(read_asset("baseline-py-ci.yml"), tmp_path)
    assert "branches: [master]" in rendered


def test_a_nested_project_finds_the_enclosing_repository(tmp_path: Path) -> None:
    _checked_out(tmp_path, "nested-tool")
    nested = tmp_path / "tools" / "nested-tool"
    nested.mkdir(parents=True)
    rendered = render_asset(read_asset("baseline-py-ci.yml"), nested)
    assert "branches: [nested-tool]" in rendered


def test_a_detached_head_keeps_main(tmp_path: Path) -> None:
    (tmp_path / ".git").mkdir()
    (tmp_path / ".git" / "HEAD").write_text("0123abcd\n", encoding="utf-8")
    rendered = render_asset(read_asset("baseline-py-ci.yml"), tmp_path)
    assert "branches: [main]" in rendered


def test_a_nested_project_runs_its_workflow_from_its_directory(tmp_path: Path) -> None:
    (tmp_path / ".git").mkdir()
    nested = tmp_path / "tools" / "nested-tool"
    nested.mkdir(parents=True)
    rendered = render_asset(read_asset("baseline-py-ci.yml"), nested)
    assert "working-directory: tools/nested-tool" in rendered
    assert "path: tools/nested-tool/pyrefly.json" in rendered


def test_a_nested_workflow_is_planned_at_the_repository_root(tmp_path: Path) -> None:
    (tmp_path / ".git").mkdir()
    nested = tmp_path / "tools" / "nested-tool"
    nested.mkdir(parents=True)
    (nested / "pyproject.toml").write_text('[project]\nname = "nested-tool"\n', encoding="utf-8")
    workflow = next(
        managed.path
        for managed in plan_init(nested, "lib", with_ci=True)
        if ".github" in str(managed.path)
    )
    assert (
        workflow.resolve() == (tmp_path / ".github" / "workflows" / "quality-nested-tool.yml").resolve()
    )
