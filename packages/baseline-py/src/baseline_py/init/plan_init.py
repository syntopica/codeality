"""Work out everything init would do, without writing anything."""

from pathlib import Path

from baseline_py.init.managed_asset_files import (
    ASSET_TARGETS,
    CI_ASSET,
    IMPORT_LINTER_ASSET,
)
from baseline_py.init.managed_file import ManagedFile
from baseline_py.init.plan_asset_file import plan_asset_file
from baseline_py.init.plan_pyproject import plan_pyproject
from baseline_py.init.plan_ruff import plan_ruff


def plan_init(
    project_root: Path, profile: str, with_ci: bool
) -> tuple[ManagedFile, ...]:
    """Return the plan. This function reads; it never writes."""
    planned = [
        plan_asset_file(project_root, name, target) for name, target in ASSET_TARGETS
    ]
    standalone_ruff = plan_ruff(project_root)
    if standalone_ruff is not None:
        planned.append(standalone_ruff)
    planned.append(plan_pyproject(project_root))
    if with_ci:
        planned.append(plan_asset_file(project_root, *CI_ASSET))
    if profile == "app":
        planned.append(plan_asset_file(project_root, *IMPORT_LINTER_ASSET))
    return tuple(planned)
