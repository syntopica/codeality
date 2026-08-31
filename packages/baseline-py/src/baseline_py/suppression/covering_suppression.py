"""Find the suppression, if any, that covers a finding."""

from baseline_py.model.finding import Finding
from baseline_py.model.rule_code import RuleCode
from baseline_py.suppression.suppression import Suppression

NEVER_SUPPRESSIBLE = frozenset({RuleCode.BPY000})


def covering_suppression(
    finding: Finding, suppressions: tuple[Suppression, ...]
) -> Suppression | None:
    """Return the suppression covering this finding, or None.

    A parse failure is never suppressible: a file that does not parse was not
    checked, and silence about it would be a lie.
    """
    if finding.code in NEVER_SUPPRESSIBLE:
        return None
    for suppression in suppressions:
        if suppression.code is not finding.code:
            continue
        if suppression.line is None or suppression.line == finding.location.line:
            return suppression
    return None
