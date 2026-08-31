"""What one run of the checker produced."""

from dataclasses import dataclass

from baseline_py.model.finding import Finding


@dataclass(frozen=True, slots=True)
class CheckResult:
    """Findings plus the metadata a report needs to be trustworthy."""

    findings: tuple[Finding, ...]
    scanned_roots: tuple[str, ...]
    scanned_files: int
    warnings: tuple[str, ...] = ()
