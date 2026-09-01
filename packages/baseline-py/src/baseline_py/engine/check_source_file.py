"""Run every rule over one already-classified file."""

from pathlib import Path

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.engine.fingerprint_findings import fingerprint_findings
from baseline_py.engine.rule_registry import RULE_REGISTRY
from baseline_py.model.finding import Finding
from baseline_py.parsing.parse_source_file import parse_source_file
from baseline_py.suppression.apply_suppressions import apply_suppressions
from baseline_py.suppression.parse_suppressions import parse_suppressions


def check_source_file(
    path: Path, relative_path: str, role: ModuleRole, config: BaselineConfig
) -> tuple[tuple[Finding, ...], tuple[str, ...]]:
    """Return this file's findings and warnings, suppressions applied."""
    source = parse_source_file(path, relative_path, role)
    if source.parse_error is not None:
        return (source.parse_error,), ()
    raw = tuple(finding for rule in RULE_REGISTRY for finding in rule(source, config))
    suppressions, warnings = parse_suppressions(source.text)
    kept, unused = apply_suppressions(raw, suppressions, config.overrides)
    return fingerprint_findings(kept, source.text), (*warnings, *unused)
