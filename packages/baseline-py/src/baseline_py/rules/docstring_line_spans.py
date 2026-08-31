"""Line ranges occupied by true docstrings, which the size rule discounts."""

import ast

_HOLDERS = (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)


def docstring_line_spans(tree: ast.Module) -> frozenset[int]:
    """Return every line belonging to a module, class or function docstring.

    A string assigned to a name is data, not a docstring, and is not returned.
    """
    lines: set[int] = set()
    for node in ast.walk(tree):
        if not isinstance(node, _HOLDERS):
            continue
        body = getattr(node, "body", [])
        if not body:
            continue
        first = body[0]
        if not isinstance(first, ast.Expr) or not isinstance(first.value, ast.Constant):
            continue
        if not isinstance(first.value.value, str):
            continue
        lines.update(range(first.lineno, (first.end_lineno or first.lineno) + 1))
    return frozenset(lines)
