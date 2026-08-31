"""Read and validate ``baseline-py.toml`` for one project."""

import tomllib
from pathlib import Path
from typing import Any

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.config_error import ConfigError
from baseline_py.config.discover_source_roots import discover_source_roots
from baseline_py.config.limits import Limits
from baseline_py.config.parse_overrides import parse_overrides
from baseline_py.config.parse_roles import parse_roles

CONFIG_FILENAME = "baseline-py.toml"
SUPPORTED_SCHEMA_VERSION = 1

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
    document = _read_document(project_root / CONFIG_FILENAME)
    _reject_unknown_keys(document, _TOP_LEVEL_KEYS, "the document root")
    _check_schema_version(document)

    limits_table = document.get("limits", {})
    _reject_unknown_keys(limits_table, _LIMIT_KEYS, "[limits]")

    source_roots = tuple(document.get("source-roots", ())) or discover_source_roots(project_root)
    return BaselineConfig(
        project_root=project_root,
        schema_version=SUPPORTED_SCHEMA_VERSION,
        source_roots=source_roots,
        test_roots=tuple(document.get("test-roots", ("tests",))),
        respect_gitignore=bool(document.get("respect-gitignore", True)),
        limits=Limits(
            max_file_lines=int(limits_table.get("max-file-lines", 150)),
            test_max_file_lines=int(limits_table.get("test-max-file-lines", 300)),
        ),
        roles=parse_roles(document.get("roles", {})),
        overrides=parse_overrides(document.get("overrides", ())),
        sql_resource_globs=tuple(document.get("sql-resource-globs", ("sql/**/*.sql",))),
        import_package=document.get("import-package"),
        coverage_threshold=int(document.get("coverage-threshold", 0)),
    )


def _read_document(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    try:
        return tomllib.loads(path.read_text(encoding="utf-8"))
    except (tomllib.TOMLDecodeError, OSError, UnicodeDecodeError) as error:
        raise ConfigError(f"{path.name} could not be read: {error}") from error


def _reject_unknown_keys(table: dict[str, Any], known: set[str], where: str) -> None:
    unknown = sorted(set(table) - known)
    if unknown:
        raise ConfigError(f"unknown key in {where}: {', '.join(unknown)}")


def _check_schema_version(document: dict[str, Any]) -> None:
    if not document:
        return
    version = document.get("schema-version")
    if version != SUPPORTED_SCHEMA_VERSION:
        raise ConfigError(
            f"schema-version must be {SUPPORTED_SCHEMA_VERSION}, found {version!r}"
        )
