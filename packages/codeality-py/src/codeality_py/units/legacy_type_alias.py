"""Recognise the pre-PEP-695 explicit type declarations."""

import ast

from codeality_py.model.location import Location
from codeality_py.units.declaration import Declaration
from codeality_py.units.declaration_kind import DeclarationKind
from codeality_py.units.named_declaration import named_declaration


def legacy_type_alias(statement: ast.stmt, location: Location) -> Declaration | None:
    """Return a declaration for ``X: TypeAlias`` or a functional type call.

    The functional forms - ``NewType``, ``TypedDict`` and ``NamedTuple`` - are
    the same declaration the class syntax makes, written the only way that
    works when a field name is a Python keyword. A plain ``Alias = list[str]``
    is deliberately not recognised: inferring intent from an unannotated
    assignment produces false positives.
    """
    if isinstance(statement, ast.AnnAssign) and isinstance(statement.target, ast.Name):
        annotation = statement.annotation
        if isinstance(annotation, ast.Name) and annotation.id == "TypeAlias":
            return named_declaration(statement.target.id, DeclarationKind.TYPE_ALIAS, location)
        return None
    if not isinstance(statement, ast.Assign) or len(statement.targets) != 1:
        return None
    target = statement.targets[0]
    value = statement.value
    is_type_call = (
        isinstance(value, ast.Call)
        and isinstance(value.func, ast.Name)
        and value.func.id in ("NewType", "TypedDict", "NamedTuple")
    )
    if isinstance(target, ast.Name) and is_type_call:
        return named_declaration(target.id, DeclarationKind.TYPE_ALIAS, location)
    return None
