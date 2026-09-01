"""Identify a finding by what it is, not by where it sits."""

import hashlib

from baseline_py.model.finding import Finding

FINGERPRINT_VERSION = 1


def fingerprint(finding: Finding, context: str) -> str:
    """Return a stable identity for this finding.

    The line number is deliberately excluded: inserting a line above a query
    must not make every finding in the file look new. The context carries the
    offending line's content and its occurrence, so a genuinely new violation
    still gets its own fingerprint.
    """
    material = "|".join(
        [str(FINGERPRINT_VERSION), finding.code.value, finding.location.path, context]
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()[:16]
