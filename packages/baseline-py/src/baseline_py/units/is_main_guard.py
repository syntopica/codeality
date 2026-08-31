"""Recognise the ``if __name__ == "__main__":`` guard."""

import ast


def is_main_guard(statement: ast.If) -> bool:
    """Return whether this conditional is the module entry guard."""
    test = statement.test
    if not isinstance(test, ast.Compare) or not isinstance(test.left, ast.Name):
        return False
    return test.left.id == "__name__"
