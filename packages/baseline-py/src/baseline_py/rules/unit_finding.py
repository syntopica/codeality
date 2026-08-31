"""Build the single file-level BPY001 finding."""

from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity


def unit_finding(
    relative_path: str,
    message: str,
    subject: str | None,
    related: tuple[Location, ...],
) -> Finding:
    """Return one file-level finding carrying the other declarations."""
    return Finding(
        code=RuleCode.BPY001,
        severity=Severity.ERROR,
        message=message,
        location=Location(path=relative_path, line=1, column=1),
        subject=subject,
        related=related,
    )
