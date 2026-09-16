"""Name a SQL finding by the statement keyword it starts with."""

import ast


def sql_subject(node: ast.AST) -> str:
    """Return the leading SQL keyword, used as the finding's subject."""
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value.strip().split()[0].lower()
    return "sql"
