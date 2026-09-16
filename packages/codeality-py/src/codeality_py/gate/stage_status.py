"""How one gate stage ended."""

from enum import StrEnum


class StageStatus(StrEnum):
    """A required stage that could not run is a failure, never a skip."""

    PASSED = "passed"
    FINDINGS = "findings"
    FAILED_TO_RUN = "failed-to-run"
    SKIPPED_NOT_APPLICABLE = "skipped-not-applicable"
