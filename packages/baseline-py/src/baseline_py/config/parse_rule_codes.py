"""Read a list of rule codes from configuration."""

from typing import Any

from baseline_py.config.config_error import ConfigError
from baseline_py.model.rule_code import RuleCode


def parse_rule_codes(raw: Any) -> tuple[RuleCode, ...]:
    """Return the codes, raising on any the tool does not define."""
    codes: list[RuleCode] = []
    for value in raw:
        try:
            codes.append(RuleCode(value))
        except ValueError as error:
            raise ConfigError(f"unknown rule code in [[overrides]]: {value}") from error
    return tuple(codes)
