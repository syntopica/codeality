"""Drop the findings a suppression or override covers."""

from baseline_py.config.override import Override
from baseline_py.model.finding import Finding
from baseline_py.suppression.covering_suppression import covering_suppression
from baseline_py.suppression.is_overridden import is_overridden
from baseline_py.suppression.suppression import Suppression


def apply_suppressions(
    findings: tuple[Finding, ...],
    suppressions: tuple[Suppression, ...],
    overrides: tuple[Override, ...],
) -> tuple[tuple[Finding, ...], tuple[str, ...]]:
    """Return the surviving findings and warnings for unused suppressions."""
    used: set[Suppression] = set()
    kept: list[Finding] = []
    for finding in findings:
        if is_overridden(finding, overrides):
            continue
        covering = covering_suppression(finding, suppressions)
        if covering is None:
            kept.append(finding)
            continue
        used.add(covering)
    unused = tuple(
        f"unused suppression for {suppression.code.value}"
        for suppression in suppressions
        if suppression not in used
    )
    return tuple(kept), unused
