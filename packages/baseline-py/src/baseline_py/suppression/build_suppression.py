"""Build one suppression from a parsed comment."""

from baseline_py.model.rule_code import RuleCode
from baseline_py.suppression.suppression import Suppression


def build_suppression(
    raw_code: str, line: int | None, reason: str | None, number: int
) -> tuple[Suppression | None, str | None]:
    """Return the suppression, or a warning naming the unknown code."""
    try:
        code = RuleCode(raw_code)
    except ValueError:
        return None, f"line {number}: unknown rule code {raw_code}"
    return Suppression(code=code, line=line, reason=reason), None
