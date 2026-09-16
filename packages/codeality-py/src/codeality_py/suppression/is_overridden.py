"""Decide whether a configured override covers a finding."""

from codeality_py.config.override import Override
from codeality_py.model.finding import Finding
from codeality_py.roles.matches_glob import matches_glob


def is_overridden(finding: Finding, overrides: tuple[Override, ...]) -> bool:
    """Return whether a reasoned path override disables this rule here."""
    return any(
        finding.code in override.disable
        and any(matches_glob(finding.location.path, pattern) for pattern in override.paths)
        for override in overrides
    )
