"""Attach a stable fingerprint to every finding of one file."""

from baseline_py.baseline.fingerprint import fingerprint
from baseline_py.baseline.fingerprint_context import fingerprint_context
from baseline_py.model.finding import Finding


def fingerprint_findings(findings: tuple[Finding, ...], text: str) -> tuple[Finding, ...]:
    """Return the findings with their fingerprint filled in.

    Two violations of the same rule in one file must not collapse into one
    baseline entry, or fixing one while adding another would go unnoticed. An
    occurrence counter separates findings that are otherwise identical.
    """
    seen: dict[tuple[str, str], int] = {}
    fingerprinted: list[Finding] = []
    for finding in findings:
        context = fingerprint_context(finding, text)
        key = (finding.code.value, context)
        seen[key] = seen.get(key, 0) + 1
        fingerprinted.append(
            Finding(
                code=finding.code,
                severity=finding.severity,
                message=finding.message,
                location=finding.location,
                subject=finding.subject,
                related=finding.related,
                fingerprint=fingerprint(finding, f"{context}#{seen[key]}"),
                baseline_state=finding.baseline_state,
            )
        )
    return tuple(fingerprinted)
