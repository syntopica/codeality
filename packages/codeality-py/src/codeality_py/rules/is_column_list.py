"""Decide whether a SELECT clause reads as a column list."""


def is_column_list(columns: str) -> bool:
    """Return whether the text between SELECT and FROM names columns.

    A star, a comma-separated list, or a single identifier qualifies. Prose
    such as "an option" does not.
    """
    stripped = columns.strip()
    if not stripped:
        return False
    if "*" in stripped or "," in stripped:
        return True
    return len(stripped.split()) == 1
