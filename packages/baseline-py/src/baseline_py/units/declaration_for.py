"""Turn one top-level statement into a declaration, when it is one."""

import ast

from baseline_py.model.location import Location
from baseline_py.units.declaration import Declaration
from baseline_py.units.declaration_kind import DeclarationKind
from baseline_py.units.decorator_names import decorator_names
from baseline_py.units.legacy_type_alias import legacy_type_alias
from baseline_py.units.named_declaration import named_declaration

_FUNCTIONS = (ast.FunctionDef, ast.AsyncFunctionDef)
# ast.TypeAlias arrives in 3.12; on 3.11 the PEP 695 syntax cannot parse at all.
_TYPE_ALIASES = (ast.TypeAlias,) if hasattr(ast, "TypeAlias") else ()


def declaration_for(statement: ast.stmt, relative_path: str) -> Declaration | None:
    """Return the declaration this statement makes, or None."""
    location = Location(
        path=relative_path,
        line=statement.lineno,
        column=statement.col_offset + 1,
        end_line=statement.end_lineno,
    )
    if isinstance(statement, ast.ClassDef):
        kind = DeclarationKind.CLASS
        return named_declaration(
            statement.name, kind, location, decorator_names(statement)
        )
    if isinstance(statement, _FUNCTIONS):
        kind = DeclarationKind.FUNCTION
        return named_declaration(
            statement.name, kind, location, decorator_names(statement)
        )
    if isinstance(statement, _TYPE_ALIASES) and isinstance(statement.name, ast.Name):
        return named_declaration(
            statement.name.id, DeclarationKind.TYPE_ALIAS, location
        )
    return legacy_type_alias(statement, location)
