"""BPY006: SQL lives in resource files, not in string literals."""

import ast

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity
from baseline_py.parsing.source_file import SourceFile
from baseline_py.rules.docstring_line_spans import docstring_line_spans
from baseline_py.rules.is_sql_literal import is_sql_literal
from baseline_py.rules.sql_subject import sql_subject

EXEMPT_ROLES = frozenset({ModuleRole.GENERATED, ModuleRole.STUB, ModuleRole.EXCLUDED})

_LITERALS = (ast.Constant, ast.JoinedStr)


def no_inline_sql(source: SourceFile, config: BaselineConfig) -> tuple[Finding, ...]:
    """Report SQL-shaped literals, docstrings excepted."""
    if source.role in EXEMPT_ROLES or source.tree is None:
        return ()
    docstrings = docstring_line_spans(source.tree)
    globs = " or ".join(config.sql_resource_globs)
    # An f-string is reported once, as the JoinedStr. Its constant parts are
    # separate nodes whose positions differ between Python 3.11 and 3.12, so
    # reporting them too made the finding's fingerprint depend on the
    # interpreter that ran the check.
    parts = {
        id(value)
        for node in ast.walk(source.tree)
        if isinstance(node, ast.JoinedStr)
        for value in node.values
    }
    return tuple(
        Finding(
            code=RuleCode.BPY006,
            severity=Severity.ERROR,
            message=f"inline SQL; move this query into {globs} and load it as a resource",
            location=Location(
                path=source.relative_path, line=node.lineno, column=node.col_offset + 1
            ),
            subject=sql_subject(node),
        )
        for node in ast.walk(source.tree)
        if isinstance(node, _LITERALS)
        and id(node) not in parts
        and is_sql_literal(node)
        and node.lineno not in docstrings
    )
