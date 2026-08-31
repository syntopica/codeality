"""Read the suppression comments out of one file."""

from baseline_py.suppression.parse_suppression_line import parse_suppression_line
from baseline_py.suppression.suppression import Suppression


def parse_suppressions(text: str) -> tuple[tuple[Suppression, ...], tuple[str, ...]]:
    """Return the suppressions found, plus warnings for malformed ones."""
    suppressions: list[Suppression] = []
    warnings: list[str] = []
    for number, line in enumerate(text.splitlines(), start=1):
        suppression, warning = parse_suppression_line(line, number)
        if suppression is not None:
            suppressions.append(suppression)
        if warning is not None:
            warnings.append(warning)
    return tuple(suppressions), tuple(warnings)
