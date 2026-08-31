"""Traversal is confined to the configured roots and never follows links out."""

from pathlib import Path

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.traversal.collect_source_files import collect_source_files


def _config(project_root: Path, **kwargs: object) -> BaselineConfig:
    return BaselineConfig(project_root=project_root, **kwargs)  # type: ignore[arg-type]


def _relative(project_root: Path, paths: tuple[Path, ...]) -> list[str]:
    return [path.relative_to(project_root).as_posix() for path in paths]


def test_only_configured_roots_are_scanned(tmp_path: Path) -> None:
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "unit.py").write_text("", encoding="utf-8")
    (tmp_path / "elsewhere").mkdir()
    (tmp_path / "elsewhere" / "stray.py").write_text("", encoding="utf-8")
    found = collect_source_files(_config(tmp_path, respect_gitignore=False))
    assert _relative(tmp_path, found) == ["src/unit.py"]


def test_default_excluded_directories_are_skipped(tmp_path: Path) -> None:
    vendored = tmp_path / "src" / ".venv" / "lib"
    vendored.mkdir(parents=True)
    (vendored / "vendored.py").write_text("", encoding="utf-8")
    (tmp_path / "src" / "unit.py").write_text("", encoding="utf-8")
    found = collect_source_files(_config(tmp_path, respect_gitignore=False))
    assert _relative(tmp_path, found) == ["src/unit.py"]


def test_stub_files_are_collected(tmp_path: Path) -> None:
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "api.pyi").write_text("", encoding="utf-8")
    found = collect_source_files(_config(tmp_path, respect_gitignore=False))
    assert _relative(tmp_path, found) == ["src/api.pyi"]


def test_symlinked_directory_escaping_the_root_is_not_followed(tmp_path: Path) -> None:
    outside = tmp_path.parent / f"{tmp_path.name}-outside"
    outside.mkdir()
    (outside / "foreign.py").write_text("", encoding="utf-8")
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "unit.py").write_text("", encoding="utf-8")
    (tmp_path / "src" / "linked").symlink_to(outside, target_is_directory=True)
    found = collect_source_files(_config(tmp_path, respect_gitignore=False))
    assert _relative(tmp_path, found) == ["src/unit.py"]


def test_gitignored_file_is_skipped_when_respect_gitignore_is_true(
    tmp_path: Path,
) -> None:
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "unit.py").write_text("", encoding="utf-8")
    (tmp_path / "src" / "scratch.py").write_text("", encoding="utf-8")
    (tmp_path / ".gitignore").write_text("scratch.py\n", encoding="utf-8")
    found = collect_source_files(_config(tmp_path))
    assert _relative(tmp_path, found) == ["src/unit.py"]


def test_vendor_excludes_survive_a_gitignore_negation(tmp_path: Path) -> None:
    vendored = tmp_path / "src" / "site-packages"
    vendored.mkdir(parents=True)
    (vendored / "vendored.py").write_text("", encoding="utf-8")
    (tmp_path / ".gitignore").write_text("!site-packages\n", encoding="utf-8")
    assert collect_source_files(_config(tmp_path)) == ()


def test_test_roots_are_scanned_too(tmp_path: Path) -> None:
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "unit.py").write_text("", encoding="utf-8")
    (tmp_path / "tests").mkdir()
    (tmp_path / "tests" / "test_unit.py").write_text("", encoding="utf-8")
    found = collect_source_files(_config(tmp_path, respect_gitignore=False))
    assert _relative(tmp_path, found) == ["src/unit.py", "tests/test_unit.py"]
