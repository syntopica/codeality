"""Render every decorator of a definition as a dotted name."""

import ast

from baseline_py.units.decorator_name import decorator_name


def decorator_names(
    node: ast.ClassDef | ast.FunctionDef | ast.AsyncFunctionDef,
) -> tuple[str, ...]:
    """Return each decorator of the node as its dotted source name."""
    return tuple(decorator_name(decorator) for decorator in node.decorator_list)
