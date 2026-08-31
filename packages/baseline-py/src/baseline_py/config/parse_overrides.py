"""Read the ``[[overrides]]`` array of tables."""

from collections.abc import Sequence
from typing import Any

from baseline_py.config.config_error import ConfigError
from baseline_py.config.override import Override
from baseline_py.config.parse_rule_codes import parse_rule_codes
from baseline_py.config.reject_unknown_keys import reject_unknown_keys

_KEYS = {"paths", "disable", "reason"}


def parse_overrides(entries: Sequence[Any]) -> tuple[Override, ...]:
    """Return validated overrides; a broad path requires a stated reason."""
    overrides: list[Override] = []
    for entry in entries:
        if not isinstance(entry, dict):
            raise ConfigError("each [[overrides]] entry must be a table")
        reject_unknown_keys(entry, _KEYS, "[[overrides]]")
        paths = tuple(entry.get("paths", ()))
        reason = str(entry.get("reason", "")).strip()
        if any("**" in path for path in paths) and not reason:
            raise ConfigError("a [[overrides]] entry matching ** requires a reason")
        overrides.append(
            Override(
                paths=paths,
                disable=parse_rule_codes(entry.get("disable", ())),
                reason=reason,
            )
        )
    return tuple(overrides)
