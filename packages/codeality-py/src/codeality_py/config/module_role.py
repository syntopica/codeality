"""The single role assigned to every scanned file before any rule runs."""

from enum import StrEnum


class ModuleRole(StrEnum):
    """What a file is, decided before its contents are counted."""

    EXCLUDED = "excluded"
    GENERATED = "generated"
    STUB = "stub"
    TEST = "test"
    NAMESPACE_INIT = "namespace-init"
    BARREL = "barrel"
    ENTRYPOINT = "entrypoint"
    DATA = "data"
    REGISTRY = "registry"
    ORDINARY = "ordinary"
