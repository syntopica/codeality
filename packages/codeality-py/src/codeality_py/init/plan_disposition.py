"""What init would do to one managed path."""

from enum import StrEnum


class PlanDisposition(StrEnum):
    """The four outcomes init reports for a managed file."""

    CREATE = "create"
    MERGE = "merge"
    CONFLICT = "conflict"
    UNCHANGED = "unchanged"
