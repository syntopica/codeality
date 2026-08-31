"""One parsed suppression comment."""

from dataclasses import dataclass

from baseline_py.model.rule_code import RuleCode


@dataclass(frozen=True, slots=True)
class Suppression:
    """A suppression. ``line`` is None for a file-wide one."""

    code: RuleCode
    line: int | None
    reason: str | None = None
