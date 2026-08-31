"""Write the plan, skipping conflicts unless they are forced."""

from baseline_py.init.managed_file import ManagedFile
from baseline_py.init.plan_disposition import PlanDisposition

_WRITTEN = (PlanDisposition.CREATE, PlanDisposition.MERGE)


def apply_init(plan: tuple[ManagedFile, ...], force: bool) -> tuple[ManagedFile, ...]:
    """Write the planned files and return the ones actually written."""
    written: list[ManagedFile] = []
    for managed in plan:
        forced = force and managed.disposition is PlanDisposition.CONFLICT
        if managed.content is None or not (managed.disposition in _WRITTEN or forced):
            continue
        managed.path.parent.mkdir(parents=True, exist_ok=True)
        managed.path.write_text(managed.content, encoding="utf-8")
        written.append(managed)
    return tuple(written)
