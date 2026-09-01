"""Build a declaration from a name, kind and position."""

from baseline_py.model.location import Location
from baseline_py.units.declaration import Declaration
from baseline_py.units.declaration_kind import DeclarationKind


def named_declaration(
    name: str,
    kind: DeclarationKind,
    location: Location,
    decorators: tuple[str, ...] = (),
) -> Declaration:
    """Return the declaration, its visibility read from the underscore rule."""
    is_overload = any(decorator.split(".")[-1] == "overload" for decorator in decorators)
    return Declaration(
        name=name,
        kind=kind,
        location=location,
        is_public=not name.startswith("_"),
        is_overload=is_overload,
        decorators=decorators,
    )
