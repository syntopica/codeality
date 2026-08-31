"""BPY003: ban grab-bag names in any path segment."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity
from baseline_py.parsing.source_file import SourceFile
from baseline_py.rules.grab_bag_names import GRAB_BAG_NAMES

EXEMPT_ROLES = frozenset({ModuleRole.GENERATED, ModuleRole.EXCLUDED})


def no_grab_bag_names(
    source: SourceFile, config: BaselineConfig
) -> tuple[Finding, ...]:
    """Report utils, helpers, misc or common as a file stem or directory.

    Tests are not exempt: ``tests/helpers.py`` is exactly the pattern to stop.
    """
    del config
    if source.role in EXEMPT_ROLES:
        return ()
    segments = source.relative_path.split("/")
    segments[-1] = segments[-1].removesuffix(".pyi").removesuffix(".py")
    offending = [
        segment for segment in segments if segment.casefold() in GRAB_BAG_NAMES
    ]
    if not offending:
        return ()
    return (
        Finding(
            code=RuleCode.BPY003,
            severity=Severity.ERROR,
            message=(
                f"{offending[0]!r} is a grab-bag name; name the module after what it holds"
            ),
            location=Location(path=source.relative_path, line=1, column=1),
            subject=offending[0],
        ),
    )
