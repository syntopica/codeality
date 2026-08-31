"""Run the declaration pipeline for one module."""

import ast

from baseline_py.units.coalesce_overloads import coalesce_overloads
from baseline_py.units.coalesce_singledispatch import coalesce_singledispatch
from baseline_py.units.collect_declarations import collect_declarations
from baseline_py.units.declaration import Declaration


def count_primary_declarations(
    tree: ast.Module, relative_path: str
) -> tuple[Declaration, ...]:
    """Return the declarations that count, public first, in source order."""
    declarations = collect_declarations(tree, relative_path)
    declarations = coalesce_overloads(declarations)
    declarations = coalesce_singledispatch(declarations)
    public = tuple(declaration for declaration in declarations if declaration.is_public)
    private = tuple(
        declaration for declaration in declarations if not declaration.is_public
    )
    return public + private
