"""How much weight a finding carries."""

from enum import StrEnum


class Severity(StrEnum):
    """Severity of a finding. Only ERROR affects the exit code."""

    ERROR = "error"
    ADVISORY = "advisory"
