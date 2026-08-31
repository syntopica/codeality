"""Collect the top-level declaration candidates of a module."""

import ast

from baseline_py.units.declaration import Declaration
from baseline_py.units.declaration_for import declaration_for
from baseline_py.units.top_level_statements import top_level_statements


def collect_declarations(
    tree: ast.Module, relative_path: str
) -> tuple[Declaration, ...]:
    """Return every top-level class, function and explicit type declaration."""
    declarations = (
        declaration_for(statement, relative_path)
        for statement in top_level_statements(tree)
    )
    return tuple(declaration for declaration in declarations if declaration is not None)
