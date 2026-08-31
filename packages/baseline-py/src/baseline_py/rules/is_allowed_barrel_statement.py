"""The grammar a barrel module is allowed to contain."""

import ast

from baseline_py.rules.is_docstring_statement import is_docstring_statement
from baseline_py.rules.is_static_dunder_assignment import is_static_dunder_assignment
from baseline_py.rules.is_type_checking_block import is_type_checking_block


def is_allowed_barrel_statement(statement: ast.stmt, index: int) -> bool:
    """Return whether a barrel may hold this top-level statement."""
    if isinstance(statement, (ast.Import, ast.ImportFrom)):
        return True
    if index == 0 and is_docstring_statement(statement):
        return True
    return is_type_checking_block(statement) or is_static_dunder_assignment(statement)
