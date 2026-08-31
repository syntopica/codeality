"""BPY004: cap the number of code lines in one file."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity
from baseline_py.parsing.source_file import SourceFile
from baseline_py.rules.count_code_lines import count_code_lines

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
