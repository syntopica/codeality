"""Render a decorator expression as a dotted name."""

import ast


def decorator_names(node: ast.ClassDef | ast.FunctionDef | ast.AsyncFunctionDef) -> tuple[str, ...]:
    """Return each decorator as its dotted source name, calls unwrapped."""
    return tuple(_name(decorator) for decorator in node.decorator_list)


def _name(expression: ast.expr) -> str:
    if isinstance(expression, ast.Call):
        return _name(expression.func)
    if isinstance(expression, ast.Attribute):
        return f"{_name(expression.value)}.{expression.attr}"
    if isinstance(expression, ast.Name):
        return expression.id
    return ""
