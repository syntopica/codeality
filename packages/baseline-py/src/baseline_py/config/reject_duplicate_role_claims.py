"""Refuse a path claimed by two module roles."""

from baseline_py.config.config_error import ConfigError
from baseline_py.config.module_role import ModuleRole


def reject_duplicate_role_claims(roles: dict[ModuleRole, tuple[str, ...]]) -> None:
    """Raise when one pattern appears under two roles.

    Two roles claiming a file is a configuration error, not a first-match-wins
    silent resolution.
    """
    seen: dict[str, ModuleRole] = {}
    for role, patterns in roles.items():
        for pattern in patterns:
            if pattern in seen:
                raise ConfigError(
                    f"{pattern} is claimed by two roles: {seen[pattern].value} and {role.value}"
                )
            seen[pattern] = role
