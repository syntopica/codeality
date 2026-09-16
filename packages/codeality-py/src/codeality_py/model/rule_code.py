"""Immutable identifiers for the structural rules."""

from enum import StrEnum

_SLUGS = {
    "BPY000": "parse-error",
    "BPY001": "one-primary-unit",
    "BPY002": "file-matches-unit",
    "BPY003": "no-grab-bag-names",
    "BPY004": "max-file-lines",
    "BPY005": "barrel-only-init",
    "BPY006": "no-inline-sql",
}


class RuleCode(StrEnum):
    """A rule identifier. Codes are never reused and never change meaning."""

    BPY000 = "BPY000"
    BPY001 = "BPY001"
    BPY002 = "BPY002"
    BPY003 = "BPY003"
    BPY004 = "BPY004"
    BPY005 = "BPY005"
    BPY006 = "BPY006"

    @property
    def slug(self) -> str:
        """Return the human-readable name shown beside the code."""
        return _SLUGS[self.value]
