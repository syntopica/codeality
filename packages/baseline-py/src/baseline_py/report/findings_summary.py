"""Count findings per rule for the report summary."""

from baseline_py.model.finding import Finding


def findings_summary(findings: tuple[Finding, ...]) -> dict[str, int]:
    """Return the total plus a per-code count, in code order."""
    counts: dict[str, int] = {}
    for finding in findings:
        counts[finding.code.value] = counts.get(finding.code.value, 0) + 1
    return {"total": len(findings), **dict(sorted(counts.items()))}
