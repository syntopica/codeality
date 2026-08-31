"""Decide whether a project needs a standalone ruff.toml."""

from pathlib import Path

from baseline_py.init.has_ruff_table import has_ruff_table
from baseline_py.init.managed_file import ManagedFile
from baseline_py.init.plan_asset_file import plan_asset_file


def plan_ruff(project_root: Path) -> ManagedFile | None:
    """Return a ruff.toml plan only when the project configures no ruff at all.

    Ruff resolves one configuration file per directory, and a sibling
    ruff.toml takes precedence over [tool.ruff] without merging it. Writing
    one into a project that already has a ruff table would silently discard
    its selects, ignores, excludes and per-file ignores; that project gets a
    merge instead, planned by plan_pyproject.
    """
    if has_ruff_table(project_root / "pyproject.toml"):
        return None
    return plan_asset_file(project_root, "ruff.toml", "ruff.toml")
