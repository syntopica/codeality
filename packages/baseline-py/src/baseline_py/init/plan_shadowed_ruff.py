"""Report a ruff.toml that silently overrides a project's [tool.ruff]."""

from pathlib import Path

from baseline_py.init.has_ruff_table import has_ruff_table
from baseline_py.init.managed_file import ManagedFile
from baseline_py.init.plan_disposition import PlanDisposition


def plan_shadowed_ruff(project_root: Path) -> ManagedFile | None:
    """Return a conflict when both ruff configurations exist at once.

    Ruff reads one configuration per directory, so a ruff.toml beside a
    pyproject that also declares [tool.ruff] wins outright and the table is
    never read. Nothing warns: the project believes it lints against rules
    that never run. The pair usually appears over time - init writes the file
    when no table exists, and a table arrives later.
    """
    ruff_toml = project_root / "ruff.toml"
    if not ruff_toml.is_file():
        return None
    if not has_ruff_table(project_root / "pyproject.toml"):
        return None
    return ManagedFile(
        ruff_toml,
        PlanDisposition.CONFLICT,
        "shadows [tool.ruff] in pyproject.toml, which ruff never reads; keep one of the two",
    )
