"""Read the ``[roles]`` table."""

from collections.abc import Mapping
from typing import Any

from baseline_py.config.config_error import ConfigError
from baseline_py.config.default_generated_globs import DEFAULT_GENERATED_GLOBS
from baseline_py.config.module_role import ModuleRole
from baseline_py.config.reject_duplicate_role_claims import reject_duplicate_role_claims
from baseline_py.config.reject_unknown_keys import reject_unknown_keys

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
    reject_unknown_keys(dict(table), {role.value for role in _CONFIGURABLE}, "[roles]")
    roles: dict[ModuleRole, tuple[str, ...]] = {}
    for role in _CONFIGURABLE:
        patterns = table.get(role.value, [])
        if not isinstance(patterns, list) or any(
            not isinstance(item, str) for item in patterns
        ):
            raise ConfigError(f"[roles] {role.value} must be a list of glob strings")
        roles[role] = tuple(patterns)
    reject_duplicate_role_claims(roles)
    roles[ModuleRole.GENERATED] = roles[ModuleRole.GENERATED] + DEFAULT_GENERATED_GLOBS
    return roles
