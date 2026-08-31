"""Read a module's intended public API from a static ``__all__``."""

import ast

from baseline_py.units.literal_string_names import literal_string_names


def resolve_exported_names(tree: ast.Module) -> frozenset[str] | None:
    """Return the names in a static literal ``__all__``, else None.

    A dynamically built ``__all__`` yields None, so visibility falls back to
    the underscore convention. Either way it never hides a declaration from
    the count.
    """
    for statement in tree.body:
        if not isinstance(statement, ast.Assign) or len(statement.targets) != 1:
            continue
        target = statement.targets[0]
        if not isinstance(target, ast.Name) or target.id != "__all__":
            continue
        return literal_string_names(statement.value)
    return None
