"""BPY005: keep ``__init__.py`` a barrel."""

import ast

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity
from baseline_py.parsing.source_file import SourceFile
from baseline_py.rules.is_static_dunder_assignment import is_static_dunder_assignment
from baseline_py.rules.is_type_checking_block import is_type_checking_block

_MESSAGE = (
    "a barrel holds a docstring, imports, re-exports and __all__; move this into its own module"
)


def barrel_only_init(source: SourceFile, config: BaselineConfig) -> tuple[Finding, ...]:
    """Report anything in a barrel beyond imports, re-exports and __all__.

    A barrel does execute its imports; what it must not do is define or call.
    """
    del config
    if source.role is not ModuleRole.BARREL or source.tree is None:
        return ()
    return tuple(
        Finding(
            code=RuleCode.BPY005,
            severity=Severity.ERROR,
            message=_MESSAGE,
            location=Location(
                path=source.relative_path, line=statement.lineno, column=statement.col_offset + 1
            ),
        )
        for index, statement in enumerate(source.tree.body)
        if not _is_allowed(statement, index)
    )


def _is_allowed(statement: ast.stmt, index: int) -> bool:
    if isinstance(statement, (ast.Import, ast.ImportFrom)):
        return True
    if index == 0 and _is_docstring(statement):
        return True
    return is_type_checking_block(statement) or is_static_dunder_assignment(statement)


def _is_docstring(statement: ast.stmt) -> bool:
    return (
        isinstance(statement, ast.Expr)
        and isinstance(statement.value, ast.Constant)
        and isinstance(statement.value.value, str)
    )
