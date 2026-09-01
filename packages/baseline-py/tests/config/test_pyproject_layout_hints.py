"""A declared layout beats a guessed one."""

from pathlib import Path

from baseline_py.config.discover_source_roots import discover_source_roots
from baseline_py.config.discover_test_roots import discover_test_roots

_FIRMWARE_HOST_PYPROJECT = """\
[project]
name = "demo-host"

[tool.hatch.build.targets.wheel]
packages = ["host/src/demo_host"]

[tool.pytest.ini_options]
testpaths = ["host/tests"]
pythonpath = ["host/src"]
"""


def _firmware_host(tmp_path: Path) -> Path:
    (tmp_path / "pyproject.toml").write_text(_FIRMWARE_HOST_PYPROJECT, encoding="utf-8")
    (tmp_path / "host" / "src" / "demo_host").mkdir(parents=True)
    (tmp_path / "host" / "src" / "demo_host" / "__init__.py").write_text("", encoding="utf-8")
    (tmp_path / "host" / "tests").mkdir()
    return tmp_path


def test_pythonpath_declares_the_source_root(tmp_path: Path) -> None:
    assert discover_source_roots(_firmware_host(tmp_path)) == ("host/src",)


def test_testpaths_declares_the_test_root(tmp_path: Path) -> None:
    assert discover_test_roots(_firmware_host(tmp_path)) == ("host/tests",)


def test_a_dot_pythonpath_declares_nothing(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[tool.pytest.ini_options]\npythonpath = ["."]\n', encoding="utf-8"
    )
    package = tmp_path / "pkg"
    package.mkdir()
    (package / "__init__.py").write_text("", encoding="utf-8")
    assert discover_source_roots(tmp_path) == ("pkg",)


def test_a_declared_root_missing_on_disk_is_not_trusted(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text(
        '[tool.pytest.ini_options]\npythonpath = ["gone/src"]\n', encoding="utf-8"
    )
    (tmp_path / "src").mkdir()
    assert discover_source_roots(tmp_path) == ("src",)
