"""The resolved configuration for one project."""

from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path

from baseline_py.config.limits import Limits
from baseline_py.config.module_role import ModuleRole
from baseline_py.config.override import Override


@dataclass(frozen=True, slots=True)
class BaselineConfig:
    """Everything the engine needs, already validated."""

    project_root: Path
    schema_version: int = 1
    source_roots: tuple[str, ...] = ("src",)
    test_roots: tuple[str, ...] = ("tests",)
    respect_gitignore: bool = True
    limits: Limits = field(default_factory=Limits)
    roles: Mapping[ModuleRole, tuple[str, ...]] = field(default_factory=dict)
    overrides: tuple[Override, ...] = ()
    sql_resource_globs: tuple[str, ...] = ("sql/**/*.sql",)
    import_package: str | None = None
    coverage_threshold: int = 0
    audit_ignore_vulns: tuple[str, ...] = ()
