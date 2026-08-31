"""Read the ``[roles]`` table and reject a file claimed by two roles."""

from collections.abc import Mapping
from typing import Any

from baseline_py.config.config_error import ConfigError
from baseline_py.config.default_generated_globs import DEFAULT_GENERATED_GLOBS
from baseline_py.config.module_role import ModuleRole

_CONFIGURABLE = (
    ModuleRole.GENERATED,
    ModuleRole.DATA,
    ModuleRole.REGISTRY,
    ModuleRole.ENTRYPOINT,
    ModuleRole.NAMESPACE_INIT,
    ModuleRole.EXCLUDED,
)


def parse_roles(table: Mapping[str, Any]) -> dict[ModuleRole, tuple[str, ...]]:
    """Return the configured role globs, merged with the generated defaults."""
    known = {role.value for role in _CONFIGURABLE}
    unknown = sorted(set(table) - known)
    if unknown:
        raise ConfigError(f"unknown key in [roles]: {', '.join(unknown)}")

    roles: dict[ModuleRole, tuple[str, ...]] = {}
    for role in _CONFIGURABLE:
        patterns = table.get(role.value, [])
        if not isinstance(patterns, list) or any(not isinstance(item, str) for item in patterns):
            raise ConfigError(f"[roles] {role.value} must be a list of glob strings")
        roles[role] = tuple(patterns)

    _reject_duplicate_claims(roles)
    roles[ModuleRole.GENERATED] = roles[ModuleRole.GENERATED] + DEFAULT_GENERATED_GLOBS
    return roles


def _reject_duplicate_claims(roles: dict[ModuleRole, tuple[str, ...]]) -> None:
    seen: dict[str, ModuleRole] = {}
    for role, patterns in roles.items():
        for pattern in patterns:
            if pattern in seen:
                raise ConfigError(
                    f"{pattern} is claimed by two roles: {seen[pattern].value} and {role.value}"
                )
            seen[pattern] = role
