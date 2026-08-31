"""Attach a stable fingerprint to every finding of one file."""

from baseline_py.baseline.fingerprint import fingerprint
from baseline_py.model.finding import Finding


def fingerprint_findings(
    findings: tuple[Finding, ...], context: str
) -> tuple[Finding, ...]:
    """Return the findings with their fingerprint filled in."""
    return tuple(
        Finding(
            code=finding.code,
            severity=finding.severity,
            message=finding.message,
            location=finding.location,
            subject=finding.subject,
            related=finding.related,
            fingerprint=fingerprint(finding, context),
            baseline_state=finding.baseline_state,
        )
        for finding in findings
    )
