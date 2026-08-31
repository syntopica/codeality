"""Read the ``[[overrides]]`` array of tables."""

from collections.abc import Sequence
from typing import Any

from baseline_py.config.config_error import ConfigError
from baseline_py.config.override import Override
from baseline_py.model.rule_code import RuleCode

_KEYS = {"paths", "disable", "reason"}


def parse_overrides(entries: Sequence[Any]) -> tuple[Override, ...]:
    """Return validated overrides; a broad path requires a stated reason."""
    overrides: list[Override] = []
    for entry in entries:
        if not isinstance(entry, dict):
            raise ConfigError("each [[overrides]] entry must be a table")
        unknown = sorted(set(entry) - _KEYS)
        if unknown:
            raise ConfigError(f"unknown key in [[overrides]]: {', '.join(unknown)}")
        paths = tuple(entry.get("paths", ()))
        reason = str(entry.get("reason", ""))
        codes = _parse_codes(entry.get("disable", ()))
        if any("**" in path for path in paths) and not reason:
            raise ConfigError("a [[overrides]] entry matching ** requires a reason")
        overrides.append(Override(paths=paths, disable=codes, reason=reason))
    return tuple(overrides)


def _parse_codes(raw: Any) -> tuple[RuleCode, ...]:
    codes: list[RuleCode] = []
    for value in raw:
        try:
            codes.append(RuleCode(value))
        except ValueError as error:
            raise ConfigError(f"unknown rule code in [[overrides]]: {value}") from error
    return tuple(codes)
