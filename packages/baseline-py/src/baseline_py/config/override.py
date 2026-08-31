"""A configured, reasoned exemption for a set of paths."""

from dataclasses import dataclass

from baseline_py.model.rule_code import RuleCode


@dataclass(frozen=True, slots=True)
class Override:
    """Disable named rules under given paths, with a recorded reason."""

    paths: tuple[str, ...]
    disable: tuple[RuleCode, ...]
    reason: str
