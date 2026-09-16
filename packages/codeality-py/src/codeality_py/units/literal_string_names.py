"""Read a literal list or tuple of strings."""

import ast


def literal_string_names(value: ast.expr) -> frozenset[str] | None:
    """Return the strings in a literal sequence, or None when it is dynamic."""
    if not isinstance(value, (ast.List, ast.Tuple)):
        return None
    names: list[str] = []
    for item in value.elts:
        if not isinstance(item, ast.Constant) or not isinstance(item.value, str):
            return None
        names.append(item.value)
    return frozenset(names)
