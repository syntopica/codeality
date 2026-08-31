"""Recognise a bare string expression standing as a docstring."""

import ast


def is_docstring_statement(statement: ast.stmt) -> bool:
    """Return whether this statement is a bare string expression."""
    return (
        isinstance(statement, ast.Expr)
        and isinstance(statement.value, ast.Constant)
        and isinstance(statement.value.value, str)
    )
