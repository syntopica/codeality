"""BPY001: one primary declaration per ordinary module."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.parsing.source_file import SourceFile
from baseline_py.rules.data_unit_findings import data_unit_findings
from baseline_py.rules.ordinary_unit_findings import ordinary_unit_findings
from baseline_py.units.count_primary_declarations import count_primary_declarations

COUNTED_ROLES = frozenset({ModuleRole.ORDINARY, ModuleRole.DATA, ModuleRole.ENTRYPOINT})


def one_primary_unit(source: SourceFile, config: BaselineConfig) -> tuple[Finding, ...]:
    """Report a module declaring more, fewer, or other units than its role allows."""
    del config
    if source.role not in COUNTED_ROLES or source.tree is None:
        return ()
    declarations = count_primary_declarations(source.tree, source.relative_path)
    if source.role is ModuleRole.DATA:
        return data_unit_findings(source.relative_path, declarations)
    return ordinary_unit_findings(source.relative_path, declarations)
