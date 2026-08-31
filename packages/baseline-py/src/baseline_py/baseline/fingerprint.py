"""Identify a finding by what it is, not by where it sits."""

import hashlib

from baseline_py.model.finding import Finding

FINGERPRINT_VERSION = 1


def fingerprint(finding: Finding, context: str) -> str:
    """Return a stable identity for this finding.

    The line number is deliberately excluded: inserting a line above a query
    must not make every finding in the file look new, while a genuinely new
    query still gets its own fingerprint through the context hash.
    """
    subject = finding.subject or context
    material = (
        f"{FINGERPRINT_VERSION}|{finding.code.value}|{finding.location.path}|{subject}"
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()[:16]
