"""BPY002: the file name is the snake_case of its primary declaration."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity
from baseline_py.parsing.source_file import SourceFile
from baseline_py.units.count_primary_declarations import count_primary_declarations
from baseline_py.units.to_snake_case import to_snake_case


def file_matches_unit(
    source: SourceFile, config: BaselineConfig
) -> tuple[Finding, ...]:
    """Report an ordinary module whose name does not name its declaration."""
    del config
    if source.role is not ModuleRole.ORDINARY or source.tree is None:
        return ()
    declarations = count_primary_declarations(source.tree, source.relative_path)
    if len(declarations) != 1:
        return ()
    expected = to_snake_case(declarations[0].name)
    stem = source.relative_path.rsplit("/", 1)[-1].removesuffix(".py")
    if stem == expected:
        return ()
    return (
        Finding(
            code=RuleCode.BPY002,
            severity=Severity.ERROR,
            message=f"{declarations[0].name} belongs in {expected}.py, not {stem}.py",
            location=declarations[0].location,
            subject=declarations[0].name,
        ),
    )
