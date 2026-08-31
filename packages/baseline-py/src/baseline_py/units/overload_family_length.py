"""Measure a valid overload family starting at one declaration."""

from baseline_py.units.declaration import Declaration


def overload_family_length(declarations: tuple[Declaration, ...], start: int) -> int:
    """Return how many declarations the family at ``start`` spans.

    A family is consecutive same-name overloads followed by exactly one
    implementation. Anything else spans one, so it is reported rather than
    silently accepted.
    """
    if not declarations[start].is_overload:
        return 1
    name = declarations[start].name
    cursor = start
    while cursor < len(declarations) and declarations[cursor].is_overload:
        if declarations[cursor].name != name:
            return 1
        cursor += 1
    implementation_follows = (
        cursor < len(declarations) and declarations[cursor].name == name
    )
    return cursor - start + 1 if implementation_follows else 1
