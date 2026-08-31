"""BPY005 allows a barrel to re-export and nothing else."""

from baseline_py.config.module_role import ModuleRole
from baseline_py.rules.barrel_only_init import barrel_only_init

_PATH = "src/pkg/__init__.py"


def _barrel(make_source, body: str, role: ModuleRole = ModuleRole.BARREL):
    return make_source(body, _PATH, role)


def test_docstring_imports_and_static_all_are_allowed(make_source, config) -> None:
    body = '"""Package."""\n\nfrom pkg.parser import Parser\n\n__all__ = ["Parser"]\n'
    assert barrel_only_init(_barrel(make_source, body), config) == ()


def test_dunder_version_assignment_is_allowed(make_source, config) -> None:
    assert barrel_only_init(_barrel(make_source, '__version__ = "1.0"\n'), config) == ()


def test_a_function_definition_in_a_barrel_is_reported(make_source, config) -> None:
    findings = barrel_only_init(
        _barrel(make_source, "def run() -> None:\n    return None\n"), config
    )
    assert len(findings) == 1


def test_a_class_definition_in_a_barrel_is_reported(make_source, config) -> None:
    assert barrel_only_init(_barrel(make_source, "class Thing:\n    pass\n"), config)


def test_a_module_scope_call_is_reported(make_source, config) -> None:
    body = "import logging\n\nlogging.basicConfig()\n"
    findings = barrel_only_init(_barrel(make_source, body), config)
    assert len(findings) == 1
    assert findings[0].location.line == 3


def test_an_arbitrary_assignment_is_reported(make_source, config) -> None:
    assert barrel_only_init(_barrel(make_source, "DEFAULT_TIMEOUT = 30\n"), config)


def test_a_dynamic_all_is_reported(make_source, config) -> None:
    body = "from pkg import parser\n\n__all__ = [name for name in dir(parser)]\n"
    assert barrel_only_init(_barrel(make_source, body), config)


def test_type_checking_block_with_imports_only_is_allowed(make_source, config) -> None:
    body = "from typing import TYPE_CHECKING\n\nif TYPE_CHECKING:\n    from pkg.parser import Parser\n"
    assert barrel_only_init(_barrel(make_source, body), config) == ()


def test_type_checking_block_containing_a_class_is_reported(
    make_source, config
) -> None:
    body = "from typing import TYPE_CHECKING\n\nif TYPE_CHECKING:\n    class Alias:\n        pass\n"
    assert barrel_only_init(_barrel(make_source, body), config)


def test_namespace_init_role_is_exempt(make_source, config) -> None:
    body = "__path__ = __import__('pkgutil').extend_path(__path__, __name__)\n"
    source = _barrel(make_source, body, ModuleRole.NAMESPACE_INIT)
    assert barrel_only_init(source, config) == ()


def test_an_ordinary_module_is_not_subject_to_the_barrel_grammar(
    make_source, config
) -> None:
    source = make_source("def run() -> None:\n    return None\n", "src/pkg/run.py")
    assert barrel_only_init(source, config) == ()
