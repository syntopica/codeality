"""Refuse a configuration table carrying a key we do not know."""

from typing import Any

from baseline_py.config.config_error import ConfigError


def reject_unknown_keys(table: dict[str, Any], known: set[str], where: str) -> None:
    """Raise when the table holds a key outside the known set.

    A typo must never fall back to a default and look enforced.
    """
    unknown = sorted(set(table) - known)
    if unknown:
        raise ConfigError(f"unknown key in {where}: {', '.join(unknown)}")
