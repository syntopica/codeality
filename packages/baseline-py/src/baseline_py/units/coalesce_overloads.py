"""Collapse an overload family into the one declaration it represents."""

from baseline_py.units.declaration import Declaration


def coalesce_overloads(declarations: tuple[Declaration, ...]) -> tuple[Declaration, ...]:
    """Return the declarations with each valid overload family collapsed.

    A family is consecutive same-name ``@overload`` declarations followed by
    exactly one implementation. A malformed family is left uncollapsed so it
    is reported rather than silently accepted.
    """
    collapsed: list[Declaration] = []
    index = 0
    while index < len(declarations):
        family_length = _family_length(declarations, index)
        collapsed.append(declarations[index + family_length - 1])
        index += family_length
    return tuple(collapsed)


def _family_length(declarations: tuple[Declaration, ...], start: int) -> int:
    if not declarations[start].is_overload:
        return 1
    name = declarations[start].name
    cursor = start
    while cursor < len(declarations) and declarations[cursor].is_overload:
        if declarations[cursor].name != name:
            return 1
        cursor += 1
    implementation_follows = cursor < len(declarations) and declarations[cursor].name == name
    return cursor - start + 1 if implementation_follows else 1
