"""Turn a SyntaxError into the BPY000 finding that reports it."""

from codeality_py.model.finding import Finding
from codeality_py.model.location import Location
from codeality_py.model.rule_code import RuleCode
from codeality_py.model.severity import Severity


def syntax_error_finding(relative_path: str, error: SyntaxError) -> Finding:
    """Return the BPY000 finding for a file that does not parse."""
    return Finding(
        code=RuleCode.BPY000,
        severity=Severity.ERROR,
        message=f"file does not parse: {error.msg}",
        location=Location(path=relative_path, line=error.lineno or 1, column=error.offset or 1),
    )
