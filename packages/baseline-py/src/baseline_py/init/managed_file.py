"""One file init manages in a consumer project."""

from dataclasses import dataclass
from pathlib import Path

from baseline_py.init.plan_disposition import PlanDisposition


@dataclass(frozen=True, slots=True)
class ManagedFile:
    """A path init would create, merge into, or leave alone."""

    path: Path
    disposition: PlanDisposition
    detail: str
    content: str | None = None
