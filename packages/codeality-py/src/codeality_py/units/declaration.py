"""One counted top-level declaration."""

from dataclasses import dataclass

from codeality_py.model.location import Location
from codeality_py.units.declaration_kind import DeclarationKind


@dataclass(frozen=True, slots=True)
class Declaration:
    """A primary declaration candidate, before role and grammar are applied."""

    name: str
    kind: DeclarationKind
    location: Location
    is_public: bool = True
    is_overload: bool = False
    decorators: tuple[str, ...] = ()
