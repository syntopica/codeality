"""Every rule the engine runs, in reporting order."""

from collections.abc import Callable

from codeality_py.config.baseline_config import BaselineConfig
from codeality_py.model.finding import Finding
from codeality_py.parsing.source_file import SourceFile
from codeality_py.rules.barrel_only_init import barrel_only_init
from codeality_py.rules.file_matches_unit import file_matches_unit
from codeality_py.rules.max_file_lines import max_file_lines
from codeality_py.rules.no_grab_bag_names import no_grab_bag_names
from codeality_py.rules.no_inline_sql import no_inline_sql
from codeality_py.rules.one_primary_unit import one_primary_unit

Rule = Callable[[SourceFile, BaselineConfig], tuple[Finding, ...]]

RULE_REGISTRY: tuple[Rule, ...] = (
    one_primary_unit,
    file_matches_unit,
    no_grab_bag_names,
    max_file_lines,
    barrel_only_init,
    no_inline_sql,
)
