"""Give every scanned file exactly one role, before any rule reads it."""

from fnmatch import fnmatch

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.roles.test_file_patterns import TEST_FILE_PATTERNS

_CONFIGURED_LATE = (ModuleRole.ENTRYPOINT, ModuleRole.DATA, ModuleRole.REGISTRY)


def assign_module_role(relative_path: str, config: BaselineConfig) -> ModuleRole:
    """Return the single role for this path.

    Precedence is fixed: excluded, generated, stub, test, namespace-init,
    barrel, then the configured entrypoint, data and registry roles, then
    ordinary. No role depends on file contents or size.
    """
    if _matches_role(relative_path, config, ModuleRole.EXCLUDED):
        return ModuleRole.EXCLUDED
    if _matches_role(relative_path, config, ModuleRole.GENERATED):
        return ModuleRole.GENERATED
    if relative_path.endswith(".pyi"):
        return ModuleRole.STUB
    if _matches_any(relative_path, TEST_FILE_PATTERNS):
        return ModuleRole.TEST
    if _matches_role(relative_path, config, ModuleRole.NAMESPACE_INIT):
        return ModuleRole.NAMESPACE_INIT
    if relative_path.endswith("__init__.py"):
        return ModuleRole.BARREL
    for role in _CONFIGURED_LATE:
        if _matches_role(relative_path, config, role):
            return role
    return ModuleRole.ORDINARY


def _matches_role(relative_path: str, config: BaselineConfig, role: ModuleRole) -> bool:
    return _matches_any(relative_path, config.roles.get(role, ()))


def _matches_any(relative_path: str, patterns: tuple[str, ...]) -> bool:
    return any(fnmatch(relative_path, pattern) for pattern in patterns)
