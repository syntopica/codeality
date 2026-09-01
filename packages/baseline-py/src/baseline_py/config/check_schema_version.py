"""Refuse a configuration written for a different schema."""

from typing import Any

from baseline_py.config.config_error import ConfigError

SUPPORTED_SCHEMA_VERSION = 1


def check_schema_version(document: dict[str, Any]) -> None:
    """Raise unless the document declares the supported schema version."""
    if not document:
        return
    version = document.get("schema-version")
    if version != SUPPORTED_SCHEMA_VERSION:
        raise ConfigError(f"schema-version must be {SUPPORTED_SCHEMA_VERSION}, found {version!r}")
