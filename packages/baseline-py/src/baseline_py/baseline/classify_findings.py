"""Split current findings into new, known and resolved."""

from baseline_py.baseline.baseline_file import BaselineFile
from baseline_py.baseline.classified_findings import ClassifiedFindings
from baseline_py.model.finding import Finding


def classify_findings(
    findings: tuple[Finding, ...], baseline: BaselineFile
) -> ClassifiedFindings:
    """Return the findings split against the baseline.

    A baseline entry with no current finding is resolved, and reporting it is
    what stops dead debt being carried forever.
    """
    new = tuple(
        finding for finding in findings if finding.fingerprint not in baseline.entries
    )
    known = tuple(
        finding for finding in findings if finding.fingerprint in baseline.entries
    )
    current = {finding.fingerprint for finding in findings}
    resolved = tuple(sorted(baseline.entries - current))
    return ClassifiedFindings(new=new, known=known, resolved=resolved)
