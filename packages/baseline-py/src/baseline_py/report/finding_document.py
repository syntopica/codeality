"""Render one finding as its JSON object."""

from baseline_py.model.finding import Finding


def finding_document(finding: Finding) -> dict[str, object]:
    """Return the frozen JSON shape of one finding."""
    return {
        "code": finding.code.value,
        "slug": finding.code.slug,
        "severity": finding.severity.value,
        "message": finding.message,
        "path": finding.location.path,
        "line": finding.location.line,
        "column": finding.location.column,
        "end_line": finding.location.end_line,
        "subject": finding.subject,
        "related": [
            {"path": location.path, "line": location.line, "column": location.column}
            for location in finding.related
        ],
        "baseline_state": finding.baseline_state,
        "fingerprint": finding.fingerprint,
    }
