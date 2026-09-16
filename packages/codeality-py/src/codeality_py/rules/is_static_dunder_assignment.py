"""Recognise the two dunder assignments a barrel may carry."""

import ast

_ALLOWED = ("__all__", "__version__")


def is_static_dunder_assignment(node: ast.stmt) -> bool:
    """Return whether this assigns a literal to ``__all__`` or ``__version__``."""
    if not isinstance(node, (ast.Assign, ast.AnnAssign)):
        return False
    targets = node.targets if isinstance(node, ast.Assign) else [node.target]
    if len(targets) != 1 or not isinstance(targets[0], ast.Name):
        return False
    if targets[0].id not in _ALLOWED:
        return False
    value = node.value
    if isinstance(value, ast.Constant):
        return True
    if not isinstance(value, (ast.List, ast.Tuple)):
        return False
    return all(
        isinstance(item, ast.Constant) and isinstance(item.value, str) for item in value.elts
    )
