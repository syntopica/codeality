"""Collapse an overload family into the one declaration it represents."""

from baseline_py.units.declaration import Declaration
from baseline_py.units.overload_family_length import overload_family_length


def coalesce_overloads(
    declarations: tuple[Declaration, ...],
) -> tuple[Declaration, ...]:
    """Return the declarations with each valid overload family collapsed."""
    collapsed: list[Declaration] = []
    index = 0
    while index < len(declarations):
        length = overload_family_length(declarations, index)
        collapsed.append(declarations[index + length - 1])
        index += length
    return tuple(collapsed)
