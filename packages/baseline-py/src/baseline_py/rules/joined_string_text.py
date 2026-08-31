"""Flatten an f-string into text a matcher can read."""

import ast


def joined_string_text(node: ast.JoinedStr) -> str:
    """Join the literal parts, standing an identifier in for each expression."""
    parts = [
        part.value
        if isinstance(part, ast.Constant) and isinstance(part.value, str)
        else "value"
        for part in node.values
    ]
    return "".join(parts)
