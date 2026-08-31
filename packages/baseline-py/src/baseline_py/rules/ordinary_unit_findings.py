"""Judge an ordinary module against the one-unit rule."""

from baseline_py.model.finding import Finding
from baseline_py.rules.unit_finding import unit_finding
from baseline_py.units.declaration import Declaration

NO_DECLARATION = (
    "no declaration in an ordinary module; give it its unit or declare it a data module"
)
NO_PUBLIC = "no public declaration; a module exports the one unit it is named after"


def ordinary_unit_findings(
    relative_path: str, declarations: tuple[Declaration, ...]
) -> tuple[Finding, ...]:
    """Return the finding for an ordinary module, or nothing when it is clean."""
    if not declarations:
        return (unit_finding(relative_path, NO_DECLARATION, None, ()),)
    if not any(declaration.is_public for declaration in declarations):
        return (unit_finding(relative_path, NO_PUBLIC, declarations[0].name, ()),)
    if len(declarations) == 1:
        return ()
    named = ", ".join(declaration.name for declaration in declarations[1:])
    message = f"{len(declarations)} declarations in one module; {named} belong in their own files"
    related = tuple(declaration.location for declaration in declarations[1:])
    return (unit_finding(relative_path, message, declarations[0].name, related),)
