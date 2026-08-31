"""Role precedence is fixed and never depends on file contents."""

from pathlib import Path

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.roles.assign_module_role import assign_module_role


def _config(**roles: tuple[str, ...]) -> BaselineConfig:
    mapped = {
        ModuleRole(name.replace("_", "-")): value for name, value in roles.items()
    }
    mapped.setdefault(ModuleRole.GENERATED, ("**/*_pb2.py", "**/migrations/*.py"))
    return BaselineConfig(project_root=Path("/project"), roles=mapped)


def test_an_ordinary_module_is_ordinary() -> None:
    assert assign_module_role("src/pkg/parser.py", _config()) is ModuleRole.ORDINARY


def test_stub_files_take_the_stub_role() -> None:
    assert assign_module_role("src/pkg/api.pyi", _config()) is ModuleRole.STUB


def test_waveform_test_py_is_recognised_as_a_test() -> None:
    assert assign_module_role("waveform_test.py", _config()) is ModuleRole.TEST


def test_conftest_and_tests_py_are_tests() -> None:
    assert assign_module_role("src/conftest.py", _config()) is ModuleRole.TEST
    assert assign_module_role("src/pkg/tests.py", _config()) is ModuleRole.TEST


def test_anything_under_a_tests_directory_is_a_test() -> None:
    assert assign_module_role("tests/support/factory.py", _config()) is ModuleRole.TEST


def test_generated_wins_over_test() -> None:
    assert assign_module_role("tests/thing_pb2.py", _config()) is ModuleRole.GENERATED


def test_generated_wins_over_stub() -> None:
    config = _config(generated=("**/*_pb2.pyi",))
    assert assign_module_role("src/thing_pb2.pyi", config) is ModuleRole.GENERATED


def test_init_is_a_barrel() -> None:
    assert assign_module_role("src/pkg/__init__.py", _config()) is ModuleRole.BARREL


def test_namespace_init_beats_barrel() -> None:
    config = _config(namespace_init=("src/pkg/__init__.py",))
    assert (
        assign_module_role("src/pkg/__init__.py", config) is ModuleRole.NAMESPACE_INIT
    )


def test_configured_data_role_beats_ordinary() -> None:
    config = _config(data=("src/pkg/constants.py",))
    assert assign_module_role("src/pkg/constants.py", config) is ModuleRole.DATA


def test_configured_registry_and_entrypoint_roles_apply() -> None:
    config = _config(
        registry=("src/pkg/routes/*.py",), entrypoint=("src/pkg/__main__.py",)
    )
    assert assign_module_role("src/pkg/routes/users.py", config) is ModuleRole.REGISTRY
    assert assign_module_role("src/pkg/__main__.py", config) is ModuleRole.ENTRYPOINT


def test_excluded_beats_everything() -> None:
    config = _config(excluded=("src/pkg/legacy.py",), data=("src/pkg/legacy.py",))
    assert assign_module_role("src/pkg/legacy.py", config) is ModuleRole.EXCLUDED


def test_a_cli_module_is_ordinary_unless_configured() -> None:
    assert assign_module_role("src/pkg/cli.py", _config()) is ModuleRole.ORDINARY
