"""Decide what identifies a finding, per rule."""

from baseline_py.baseline.finding_context import finding_context
from baseline_py.model.finding import Finding
from baseline_py.model.rule_code import RuleCode

#: Rules that report once per file. Their anchor is line 1, whose content says
#: nothing about the violation, and the subject of a size finding is a count
#: that moves with every edit.
FILE_LEVEL = frozenset({RuleCode.BPY001, RuleCode.BPY004})

#: Rules whose subject names the thing that is wrong and is unique in the file.
SUBJECT_LEVEL = frozenset({RuleCode.BPY002, RuleCode.BPY003})


def fingerprint_context(finding: Finding, text: str) -> str:
    """Return the text identifying this finding within its file.

    A file-level rule identifies itself. A naming rule identifies the symbol.
    Everything else can fire many times in one file, so it is identified by the
    offending line's content, which survives edits elsewhere in the file.
    """
    if finding.code in FILE_LEVEL:
        return ""
    if finding.code in SUBJECT_LEVEL:
        return finding.subject or ""
    return finding_context(text, finding.location.line)
