"""BPY001: one primary declaration per ordinary module."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity
from baseline_py.parsing.source_file import SourceFile
from baseline_py.units.count_primary_declarations import count_primary_declarations
from baseline_py.units.declaration import Declaration

COUNTED_ROLES = frozenset({ModuleRole.ORDINARY, ModuleRole.DATA, ModuleRole.ENTRYPOINT})

_NO_DECLARATION = (
    "no declaration in an ordinary module; give it its unit or declare it a data module"
)
_NO_PUBLIC = "no public declaration; a module exports the one unit it is named after"
_DATA_DECLARES = "a data module declares no class, function or type alias"


def one_primary_unit(source: SourceFile, config: BaselineConfig) -> tuple[Finding, ...]:
    """Report a module declaring more, fewer, or other units than its role allows."""
    del config
    if source.role not in COUNTED_ROLES or source.tree is None:
        return ()
    declarations = count_primary_declarations(source.tree, source.relative_path)
    if source.role is ModuleRole.DATA:
        return _data_findings(source, declarations)
    return _ordinary_findings(source, declarations)


def _ordinary_findings(
    source: SourceFile, declarations: tuple[Declaration, ...]
) -> tuple[Finding, ...]:
    if not declarations:
        return (_finding(source, _NO_DECLARATION, None, ()),)
    public = [declaration for declaration in declarations if declaration.is_public]
    if not public:
        return (_finding(source, _NO_PUBLIC, declarations[0].name, ()),)
    if len(declarations) == 1:
        return ()
    named = ", ".join(declaration.name for declaration in declarations[1:])
    message = f"{len(declarations)} declarations in one module; {named} belong in their own files"
    related = tuple(declaration.location for declaration in declarations[1:])
    return (_finding(source, message, declarations[0].name, related),)


def _data_findings(
    source: SourceFile, declarations: tuple[Declaration, ...]
) -> tuple[Finding, ...]:
    if not declarations:
        return ()
    return (_finding(source, _DATA_DECLARES, declarations[0].name, ()),)


def _finding(
    source: SourceFile,
    message: str,
    subject: str | None,
    related: tuple[Location, ...],
) -> Finding:
    return Finding(
        code=RuleCode.BPY001,
        severity=Severity.ERROR,
        message=message,
        location=Location(path=source.relative_path, line=1, column=1),
        subject=subject,
        related=related,
    )
