"""BPY005: keep ``__init__.py`` a barrel."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity
from baseline_py.parsing.source_file import SourceFile
from baseline_py.rules.is_allowed_barrel_statement import is_allowed_barrel_statement

_MESSAGE = (
    "a barrel holds a docstring, imports, re-exports and __all__; move this into its own module"
)


def barrel_only_init(source: SourceFile, config: BaselineConfig) -> tuple[Finding, ...]:
    """Report anything in a barrel beyond imports, re-exports and __all__.

    A barrel does execute its imports; what it must not do is define or call.
    """
    del config
    if source.role is not ModuleRole.BARREL or source.tree is None:
        return ()
    return tuple(
        Finding(
            code=RuleCode.BPY005,
            severity=Severity.ERROR,
            message=_MESSAGE,
            location=Location(
                path=source.relative_path,
                line=statement.lineno,
                column=statement.col_offset + 1,
            ),
        )
        for index, statement in enumerate(source.tree.body)
        if not is_allowed_barrel_statement(statement, index)
    )
