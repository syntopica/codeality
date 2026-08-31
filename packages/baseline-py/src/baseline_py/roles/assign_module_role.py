"""Give every scanned file exactly one role, before any rule reads it."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.roles.matches_any_pattern import matches_any_pattern
from baseline_py.roles.test_file_patterns import TEST_FILE_PATTERNS

_CONFIGURED_LATE = (ModuleRole.ENTRYPOINT, ModuleRole.DATA, ModuleRole.REGISTRY)


def assign_module_role(relative_path: str, config: BaselineConfig) -> ModuleRole:
    """Return the single role for this path.

    Precedence is fixed: excluded, generated, stub, test, namespace-init,
    barrel, then the configured entrypoint, data and registry roles, then
    ordinary. No role depends on file contents or size.
    """
    roles = config.roles
    if matches_any_pattern(relative_path, roles.get(ModuleRole.EXCLUDED, ())):
        return ModuleRole.EXCLUDED
    if matches_any_pattern(relative_path, roles.get(ModuleRole.GENERATED, ())):
        return ModuleRole.GENERATED
    if relative_path.endswith(".pyi"):
        return ModuleRole.STUB
    if matches_any_pattern(relative_path, TEST_FILE_PATTERNS):
        return ModuleRole.TEST
    if matches_any_pattern(relative_path, roles.get(ModuleRole.NAMESPACE_INIT, ())):
        return ModuleRole.NAMESPACE_INIT
    if relative_path.endswith("__init__.py"):
        return ModuleRole.BARREL
    for role in _CONFIGURED_LATE:
        if matches_any_pattern(relative_path, roles.get(role, ())):
            return role
    return ModuleRole.ORDINARY
