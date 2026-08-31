"""Decide whether a configured override covers a finding."""

from fnmatch import fnmatch

from baseline_py.config.override import Override
from baseline_py.model.finding import Finding


def is_overridden(finding: Finding, overrides: tuple[Override, ...]) -> bool:
    """Return whether a reasoned path override disables this rule here."""
    return any(
        finding.code in override.disable
        and any(fnmatch(finding.location.path, pattern) for pattern in override.paths)
        for override in overrides
    )
