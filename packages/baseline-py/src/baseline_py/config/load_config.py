"""Read and validate ``baseline-py.toml`` for one project."""

from pathlib import Path

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.check_schema_version import (
    SUPPORTED_SCHEMA_VERSION,
    check_schema_version,
)
from baseline_py.config.discover_source_roots import discover_source_roots
from baseline_py.config.discover_test_roots import discover_test_roots
from baseline_py.config.limits import Limits
from baseline_py.config.parse_overrides import parse_overrides
from baseline_py.config.parse_roles import parse_roles
from baseline_py.config.read_config_document import read_config_document
from baseline_py.config.reject_unknown_keys import reject_unknown_keys

CONFIG_FILENAME = "baseline-py.toml"

_TOP_LEVEL_KEYS = {
    "schema-version",
    "source-roots",
    "test-roots",
    "respect-gitignore",
    "sql-resource-globs",
    "import-package",
    "coverage-threshold",
    "limits",
    "roles",
    "overrides",
}
_LIMIT_KEYS = {"max-file-lines", "test-max-file-lines"}


def load_config(project_root: Path) -> BaselineConfig:
    """Return the validated configuration, or defaults when no file exists."""
    document = read_config_document(project_root / CONFIG_FILENAME)
    reject_unknown_keys(document, _TOP_LEVEL_KEYS, "the document root")
    check_schema_version(document)

    limits = document.get("limits", {})
    reject_unknown_keys(limits, _LIMIT_KEYS, "[limits]")
    source_roots = tuple(document.get("source-roots", ())) or discover_source_roots(project_root)
    return BaselineConfig(
        project_root=project_root,
        schema_version=SUPPORTED_SCHEMA_VERSION,
        source_roots=source_roots,
        test_roots=tuple(document.get("test-roots", ())) or discover_test_roots(project_root),
        respect_gitignore=bool(document.get("respect-gitignore", True)),
        limits=Limits(
            max_file_lines=int(limits.get("max-file-lines", 150)),
            test_max_file_lines=int(limits.get("test-max-file-lines", 300)),
        ),
        roles=parse_roles(document.get("roles", {})),
        overrides=parse_overrides(document.get("overrides", ())),
        sql_resource_globs=tuple(document.get("sql-resource-globs", ("sql/**/*.sql",))),
        import_package=document.get("import-package"),
        coverage_threshold=int(document.get("coverage-threshold", 0)),
    )
