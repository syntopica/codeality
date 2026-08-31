"""Collect the top-level declaration candidates of a module."""

import ast

from baseline_py.model.location import Location
from baseline_py.units.declaration import Declaration
from baseline_py.units.declaration_kind import DeclarationKind
from baseline_py.units.decorator_names import decorator_names

_FUNCTIONS = (ast.FunctionDef, ast.AsyncFunctionDef)


def collect_declarations(tree: ast.Module, relative_path: str) -> tuple[Declaration, ...]:
    """Return every top-level class, function and explicit type declaration.

    A plain ``Alias = list[str]`` is deliberately not a candidate: inferring
    intent from an unannotated assignment produces false positives, and the
    type checker can require the explicit form.
    """
    declarations: list[Declaration] = []
    for statement in _top_level_statements(tree):
        declaration = _declaration_for(statement, relative_path)
        if declaration is not None:
            declarations.append(declaration)
    return tuple(declarations)


def _top_level_statements(tree: ast.Module) -> list[ast.stmt]:
    """Return module-level statements, unwrapping non-TYPE_CHECKING guards.

    A declaration moved under a top-level ``if`` is still a declaration; the
    scan must not be evadable by indenting it one level.
    """
    statements: list[ast.stmt] = []
    for statement in tree.body:
        statements.append(statement)
        if isinstance(statement, ast.If) and not _is_main_guard(statement):
            statements.extend(statement.body)
            statements.extend(statement.orelse)
    return statements


def _is_main_guard(statement: ast.If) -> bool:
    test = statement.test
    if not isinstance(test, ast.Compare) or not isinstance(test.left, ast.Name):
        return False
    return test.left.id == "__name__"


def _declaration_for(statement: ast.stmt, relative_path: str) -> Declaration | None:
    location = Location(
        path=relative_path,
        line=statement.lineno,
        column=statement.col_offset + 1,
        end_line=statement.end_lineno,
    )
    if isinstance(statement, ast.ClassDef):
        return _named(statement.name, DeclarationKind.CLASS, location, decorator_names(statement))
    if isinstance(statement, _FUNCTIONS):
        decorators = decorator_names(statement)
        declaration = _named(statement.name, DeclarationKind.FUNCTION, location, decorators)
        return _with_overload(declaration, decorators)
    if isinstance(statement, ast.TypeAlias) and isinstance(statement.name, ast.Name):
        return _named(statement.name.id, DeclarationKind.TYPE_ALIAS, location, ())
    return _legacy_type_alias(statement, location)


def _named(
    name: str, kind: DeclarationKind, location: Location, decorators: tuple[str, ...]
) -> Declaration:
    return Declaration(
        name=name,
        kind=kind,
        location=location,
        is_public=not name.startswith("_"),
        decorators=decorators,
    )


def _with_overload(declaration: Declaration, decorators: tuple[str, ...]) -> Declaration:
    is_overload = any(name.split(".")[-1] == "overload" for name in decorators)
    return Declaration(
        name=declaration.name,
        kind=declaration.kind,
        location=declaration.location,
        is_public=declaration.is_public,
        is_overload=is_overload,
        decorators=decorators,
    )


def _legacy_type_alias(statement: ast.stmt, location: Location) -> Declaration | None:
    if isinstance(statement, ast.AnnAssign) and isinstance(statement.target, ast.Name):
        annotation = statement.annotation
        named = isinstance(annotation, ast.Name) and annotation.id == "TypeAlias"
        if named:
            return _named(statement.target.id, DeclarationKind.TYPE_ALIAS, location, ())
        return None
    if not isinstance(statement, ast.Assign) or len(statement.targets) != 1:
        return None
    target = statement.targets[0]
    value = statement.value
    is_new_type = (
        isinstance(value, ast.Call)
        and isinstance(value.func, ast.Name)
        and value.func.id == "NewType"
    )
    if isinstance(target, ast.Name) and is_new_type:
        return _named(target.id, DeclarationKind.TYPE_ALIAS, location, ())
    return None
