"""Recognise an ``if TYPE_CHECKING:`` block containing imports only."""

import ast


def is_type_checking_block(node: ast.stmt) -> bool:
    """Return whether this is a TYPE_CHECKING guard holding only imports."""
    if not isinstance(node, ast.If):
        return False
    test = node.test
    named = isinstance(test, ast.Name) and test.id == "TYPE_CHECKING"
    attributed = isinstance(test, ast.Attribute) and test.attr == "TYPE_CHECKING"
    if not (named or attributed) or node.orelse:
        return False
    return all(
        isinstance(statement, (ast.Import, ast.ImportFrom)) for statement in node.body
    )
