"""Plan every edit baseline-py makes to pyproject.toml, as one file."""

from pathlib import Path

from baseline_py.init.has_ruff_table import has_ruff_table
from baseline_py.init.managed_file import ManagedFile
from baseline_py.init.merge_pyproject_sections import merge_pyproject_sections
from baseline_py.init.merge_ruff_config import merge_ruff_config
from baseline_py.init.plan_disposition import PlanDisposition


def plan_pyproject(project_root: Path) -> ManagedFile:
    """Return one plan entry covering the ruff merge and the owned tables.

    Both edits are computed in sequence against the same text. Planning them
    as two entries would have the second overwrite the first, because each
    would start from the untouched file on disk.
    """
    pyproject = project_root / "pyproject.toml"
    if not pyproject.is_file():
        return ManagedFile(
            pyproject, PlanDisposition.CONFLICT, "no pyproject.toml to merge into"
        )
    original = pyproject.read_text(encoding="utf-8")
    merged = original
    details: list[str] = []
    if has_ruff_table(pyproject):
        merged = merge_ruff_config(merged)
        details.append("extends the existing [tool.ruff]")
    merged = merge_pyproject_sections(merged)
    details.append("adds deptry, pytest, coverage and the quality group")
    if merged == original:
        return ManagedFile(pyproject, PlanDisposition.UNCHANGED, "already current")
    return ManagedFile(pyproject, PlanDisposition.MERGE, "; ".join(details), merged)
