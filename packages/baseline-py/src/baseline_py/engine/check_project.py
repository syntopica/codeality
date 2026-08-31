"""Run every applicable rule over one project."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.engine.check_result import CheckResult
from baseline_py.engine.check_source_file import check_source_file
from baseline_py.model.finding import Finding
from baseline_py.roles.assign_module_role import assign_module_role
from baseline_py.traversal.collect_source_files import collect_source_files


def check_project(config: BaselineConfig) -> CheckResult:
    """Return every finding in the project, suppressions already applied."""
    findings: list[Finding] = []
    warnings: list[str] = []
    project_root = config.project_root.resolve()
    scanned = 0
    for path in collect_source_files(config):
        relative = path.relative_to(project_root).as_posix()
        role = assign_module_role(relative, config)
        if role is ModuleRole.EXCLUDED:
            continue
        scanned += 1
        file_findings, file_warnings = check_source_file(path, relative, role, config)
        findings.extend(file_findings)
        warnings.extend(f"{relative}: {warning}" for warning in file_warnings)
    return CheckResult(
        findings=tuple(sorted(findings)),
        scanned_roots=(*config.source_roots, *config.test_roots),
        scanned_files=scanned,
        warnings=tuple(warnings),
    )
