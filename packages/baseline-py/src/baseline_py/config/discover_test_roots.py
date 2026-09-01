"""Find the test roots of a project that does not declare them."""

from pathlib import Path

from baseline_py.config.pyproject_layout_hints import pyproject_layout_hints


def discover_test_roots(project_root: Path) -> tuple[str, ...]:
    """Return the declared testpaths when they exist on disk, else ``tests``."""
    _, tests = pyproject_layout_hints(project_root)
    existing = tuple(root for root in tests if (project_root / root).is_dir())
    return existing or ("tests",)
