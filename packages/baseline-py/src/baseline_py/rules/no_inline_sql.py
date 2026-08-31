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
from baseline_py.rules.looks_like_sql import looks_like_sql

EXEMPT_ROLES = frozenset({ModuleRole.GENERATED, ModuleRole.STUB, ModuleRole.EXCLUDED})


def no_inline_sql(source: SourceFile, config: BaselineConfig) -> tuple[Finding, ...]:
    """Report SQL-shaped literals, docstrings excepted."""
    if source.role in EXEMPT_ROLES or source.tree is None:
        return ()
    docstrings = docstring_line_spans(source.tree)
    globs = " or ".join(config.sql_resource_globs)
    return tuple(
        Finding(
            code=RuleCode.BPY006,
            severity=Severity.ERROR,
            message=f"inline SQL; move this query into {globs} and load it as a resource",
            location=Location(path=source.relative_path, line=node.lineno, column=node.col_offset + 1),
            subject=_subject(node),
        )
        for node in ast.walk(source.tree)
        if _is_sql_literal(node) and node.lineno not in docstrings
    )


def _is_sql_literal(node: ast.AST) -> bool:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return looks_like_sql(node.value)
    if isinstance(node, ast.JoinedStr):
        return looks_like_sql(_joined_text(node))
    return False


def _joined_text(node: ast.JoinedStr) -> str:
    """Join the literal parts, standing an identifier in for each expression."""
    parts = [
        part.value if isinstance(part, ast.Constant) and isinstance(part.value, str) else "value"
        for part in node.values
    ]
    return "".join(parts)


def _subject(node: ast.AST) -> str:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value.strip().split()[0].lower()
    return "sql"
