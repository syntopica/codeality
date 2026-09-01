"""Decide what init would do with one standalone asset."""

from pathlib import Path

from baseline_py.init.managed_file import ManagedFile
from baseline_py.init.plan_disposition import PlanDisposition
from baseline_py.init.read_asset import read_asset
from baseline_py.init.render_asset import render_asset


def plan_asset_file(project_root: Path, asset_name: str, target: str) -> ManagedFile:
    """Return the disposition for a file init writes whole."""
    content = render_asset(read_asset(asset_name), project_root)
    path = project_root / target
    if not path.exists():
        return ManagedFile(path, PlanDisposition.CREATE, "not present", content)
    existing = path.read_text(encoding="utf-8", errors="replace")
    if existing == content:
        return ManagedFile(path, PlanDisposition.UNCHANGED, "already current", content)
    return ManagedFile(
        path,
        PlanDisposition.CONFLICT,
        "exists and differs; use --force to replace",
        content,
    )
