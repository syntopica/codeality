"""BPY004: cap the number of code lines in one file."""

from codeality_py.config.baseline_config import BaselineConfig
from codeality_py.config.module_role import ModuleRole
from codeality_py.model.finding import Finding
from codeality_py.model.location import Location
from codeality_py.model.rule_code import RuleCode
from codeality_py.model.severity import Severity
from codeality_py.parsing.source_file import SourceFile
from codeality_py.rules.count_code_lines import count_code_lines

EXEMPT_ROLES = frozenset({ModuleRole.GENERATED, ModuleRole.STUB, ModuleRole.EXCLUDED})


def max_file_lines(source: SourceFile, config: BaselineConfig) -> tuple[Finding, ...]:
    """Report a file over its cap. Tests carry a separate, looser cap."""
    if source.role in EXEMPT_ROLES:
        return ()
    limit = (
        config.limits.test_max_file_lines
        if source.role is ModuleRole.TEST
        else config.limits.max_file_lines
    )
    counted = count_code_lines(source)
    if counted <= limit:
        return ()
    return (
        Finding(
            code=RuleCode.BPY004,
            severity=Severity.ERROR,
            message=f"{counted} code lines, over the cap of {limit}; split this module",
            location=Location(path=source.relative_path, line=1, column=1),
            subject=str(counted),
        ),
    )
