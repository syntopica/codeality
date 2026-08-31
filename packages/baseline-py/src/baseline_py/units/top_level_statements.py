"""List the statements a declaration can be found in."""

import ast

from baseline_py.units.is_main_guard import is_main_guard


def top_level_statements(tree: ast.Module) -> list[ast.stmt]:
    """Return module-level statements, unwrapping non-entry conditionals.

    A declaration moved under a top-level ``if`` is still a declaration; the
    scan must not be evadable by indenting it one level.
    """
    statements: list[ast.stmt] = []
    for statement in tree.body:
        statements.append(statement)
        if isinstance(statement, ast.If) and not is_main_guard(statement):
            statements.extend(statement.body)
            statements.extend(statement.orelse)
    return statements
