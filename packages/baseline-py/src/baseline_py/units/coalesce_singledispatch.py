"""Attach private singledispatch handlers to their local dispatcher."""

from baseline_py.units.declaration import Declaration


def coalesce_singledispatch(declarations: tuple[Declaration, ...]) -> tuple[Declaration, ...]:
    """Drop ``@<local>.register`` handlers named ``_`` of a local dispatcher.

    A named handler stays: it is independently addressable. A registration on
    a dispatcher imported from elsewhere stays too, because it is not an
    implementation detail of anything declared here.
    """
    dispatchers = {
        declaration.name
        for declaration in declarations
        if any(name.split(".")[-1] == "singledispatch" for name in declaration.decorators)
    }
    return tuple(
        declaration
        for declaration in declarations
        if not _is_private_local_handler(declaration, dispatchers)
    )


def _is_private_local_handler(declaration: Declaration, dispatchers: set[str]) -> bool:
    if declaration.name != "_":
        return False
    return any(
        name.endswith(".register") and name.rsplit(".", 1)[0] in dispatchers
        for name in declaration.decorators
    )
