"""Render one decorator expression as a dotted name."""

import ast


def decorator_name(expression: ast.expr) -> str:
    """Return the dotted source name of a decorator, calls unwrapped."""
    if isinstance(expression, ast.Call):
        return decorator_name(expression.func)
    if isinstance(expression, ast.Attribute):
        return f"{decorator_name(expression.value)}.{expression.attr}"
    if isinstance(expression, ast.Name):
        return expression.id
    return ""
