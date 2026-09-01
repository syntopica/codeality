"""Recognise a private handler registered on a locally declared dispatcher."""

from baseline_py.units.declaration import Declaration


def is_private_local_handler(declaration: Declaration, dispatchers: frozenset[str]) -> bool:
    """Return whether this is a ``_`` handler of a local singledispatch."""
    if declaration.name != "_":
        return False
    return any(
        name.endswith(".register") and name.rsplit(".", 1)[0] in dispatchers
        for name in declaration.decorators
    )
