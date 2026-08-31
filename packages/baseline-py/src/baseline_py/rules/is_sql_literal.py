"""Decide whether an AST node is a SQL string."""

import ast

from baseline_py.rules.joined_string_text import joined_string_text
from baseline_py.rules.looks_like_sql import looks_like_sql


def is_sql_literal(node: ast.AST) -> bool:
    """Return whether this node is a string literal holding SQL."""
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return looks_like_sql(node.value)
    if isinstance(node, ast.JoinedStr):
        return looks_like_sql(joined_string_text(node))
    return False
