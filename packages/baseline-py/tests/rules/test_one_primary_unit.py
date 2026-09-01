"""BPY001 implements the spec's symbol decision table, row by row."""

import ast

import pytest

from baseline_py.config.module_role import ModuleRole
from baseline_py.rules.one_primary_unit import one_primary_unit


def _clean(make_source, config, body: str, role: ModuleRole = ModuleRole.ORDINARY) -> bool:
    return one_primary_unit(make_source(body, "src/pkg/unit.py", role), config) == ()


def test_one_public_class_is_clean(make_source, config) -> None:
    assert _clean(make_source, config, "class Parser:\n    def run(self) -> None: ...\n")


def test_one_public_function_is_clean(make_source, config) -> None:
    assert _clean(make_source, config, "def parse() -> None:\n    return None\n")


def test_two_public_classes_are_reported(make_source, config) -> None:
    findings = one_primary_unit(make_source("class A:\n    pass\n\n\nclass B:\n    pass\n"), config)
    assert len(findings) == 1
    assert findings[0].subject == "A"
    assert findings[0].related[0].line == 5


def test_a_dataclass_counts_once(make_source, config) -> None:
    body = (
        "from dataclasses import dataclass\n\n\n@dataclass\nclass Point:\n    x: int\n    y: int\n"
    )
    assert _clean(make_source, config, body)


def test_a_protocol_and_its_implementation_are_two_units(make_source, config) -> None:
    body = (
        "from typing import Protocol\n\n\nclass Store(Protocol):\n    ...\n\n\n"
        "class SqliteStore:\n    ...\n"
    )
    assert not _clean(make_source, config, body)


def test_an_enum_counts(make_source, config) -> None:
    body = "from enum import Enum\n\n\nclass Colour(Enum):\n    RED = 1\n"
    assert _clean(make_source, config, body)


def test_a_typed_dict_beside_a_function_is_reported(make_source, config) -> None:
    body = (
        "from typing import TypedDict\n\n\nclass Payload(TypedDict):\n    name: str\n\n\n"
        "def send(payload: Payload) -> None:\n    return None\n"
    )
    assert not _clean(make_source, config, body)


@pytest.mark.skipif(not hasattr(ast, "TypeAlias"), reason="PEP 695 syntax needs Python 3.12")
def test_a_pep_695_type_alias_counts(make_source, config) -> None:
    body = "type Rows = list[dict[str, str]]\n\n\ndef load() -> Rows:\n    return []\n"
    assert not _clean(make_source, config, body)


def test_an_explicit_legacy_type_alias_counts(make_source, config) -> None:
    body = (
        "from typing import TypeAlias\n\nRows: TypeAlias = list[str]\n\n\n"
        "def load() -> Rows:\n    return []\n"
    )
    assert not _clean(make_source, config, body)


def test_new_type_counts(make_source, config) -> None:
    body = (
        "from typing import NewType\n\nUserId = NewType('UserId', int)\n\n\n"
        "def load(user: UserId) -> None:\n    return None\n"
    )
    assert not _clean(make_source, config, body)


def test_a_plain_assignment_alias_does_not_count(make_source, config) -> None:
    body = "Rows = list[str]\n\n\ndef load() -> Rows:\n    return []\n"
    assert _clean(make_source, config, body)


def test_imports_do_not_count(make_source, config) -> None:
    body = (
        "import os\nfrom pathlib import Path\n\n\ndef run(path: Path) -> str:\n    return os.sep\n"
    )
    assert _clean(make_source, config, body)


def test_constants_logger_and_sentinel_do_not_count(make_source, config) -> None:
    body = (
        "import logging\n\nlogger = logging.getLogger(__name__)\nTIMEOUT = 30\n"
        "MISSING = object()\n\n\ndef run() -> None:\n    return None\n"
    )
    assert _clean(make_source, config, body)


def test_a_static_all_does_not_hide_a_second_declaration(make_source, config) -> None:
    body = "__all__ = ['A']\n\n\nclass A:\n    pass\n\n\nclass B:\n    pass\n"
    assert not _clean(make_source, config, body)


def test_an_overload_family_counts_once(make_source, config) -> None:
    body = (
        "from typing import overload\n\n\n@overload\ndef parse(value: int) -> int: ...\n\n\n"
        "@overload\ndef parse(value: str) -> str: ...\n\n\n"
        "def parse(value: int | str) -> int | str:\n    return value\n"
    )
    assert _clean(make_source, config, body)


def test_a_local_singledispatch_with_private_handlers_counts_once(make_source, config) -> None:
    body = (
        "from functools import singledispatch\n\n\n@singledispatch\n"
        "def render(value: object) -> str:\n    return str(value)\n\n\n"
        "@render.register\ndef _(value: int) -> str:\n    return hex(value)\n"
    )
    assert _clean(make_source, config, body)


def test_a_named_register_handler_counts_separately(make_source, config) -> None:
    body = (
        "from functools import singledispatch\n\n\n@singledispatch\n"
        "def render(value: object) -> str:\n    return str(value)\n\n\n"
        "@render.register\ndef render_int(value: int) -> str:\n    return hex(value)\n"
    )
    assert not _clean(make_source, config, body)


def test_a_registration_on_an_imported_dispatcher_counts(make_source, config) -> None:
    body = (
        "from pkg.render import render\n\n\n@render.register\n"
        "def _(value: int) -> str:\n    return hex(value)\n"
    )
    assert not _clean(make_source, config, body)


def test_two_route_functions_are_reported(make_source, config) -> None:
    body = (
        "from app import app\n\n\n@app.route('/a')\ndef a() -> str:\n    return 'a'\n\n\n"
        "@app.route('/b')\ndef b() -> str:\n    return 'b'\n"
    )
    assert not _clean(make_source, config, body)


def test_a_registry_role_allows_many_decorated_functions(make_source, config) -> None:
    body = (
        "from app import app\n\n\n@app.route('/a')\ndef a() -> str:\n    return 'a'\n\n\n"
        "@app.route('/b')\ndef b() -> str:\n    return 'b'\n"
    )
    assert _clean(make_source, config, body, ModuleRole.REGISTRY)


def test_a_private_helper_beside_a_public_class_is_reported(make_source, config) -> None:
    body = "class Parser:\n    pass\n\n\ndef _normalise(value: str) -> str:\n    return value\n"
    assert not _clean(make_source, config, body)


def test_a_nested_function_does_not_count(make_source, config) -> None:
    body = "def outer() -> int:\n    def inner() -> int:\n        return 1\n\n    return inner()\n"
    assert _clean(make_source, config, body)


def test_a_type_checking_import_block_does_not_count(make_source, config) -> None:
    body = (
        "from typing import TYPE_CHECKING\n\nif TYPE_CHECKING:\n    from pkg.store import Store\n\n\n"
        "def run(store: 'Store') -> None:\n    return None\n"
    )
    assert _clean(make_source, config, body)


def test_a_main_guard_calling_the_entry_function_does_not_count(make_source, config) -> None:
    body = "def main() -> None:\n    return None\n\n\nif __name__ == '__main__':\n    main()\n"
    assert _clean(make_source, config, body)


def test_a_declaration_hidden_under_a_top_level_if_is_still_counted(make_source, config) -> None:
    body = (
        "import sys\n\n\nclass Parser:\n    pass\n\n\nif sys.platform == 'darwin':\n"
        "    class MacParser:\n        pass\n"
    )
    assert not _clean(make_source, config, body)


def test_a_module_with_no_declaration_is_reported(make_source, config) -> None:
    findings = one_primary_unit(make_source("TIMEOUT = 30\nRETRIES = 3\n"), config)
    assert len(findings) == 1
    assert "no declaration" in findings[0].message


def test_a_data_role_module_may_declare_nothing(make_source, config) -> None:
    assert _clean(make_source, config, "TIMEOUT = 30\nRETRIES = 3\n", ModuleRole.DATA)


def test_a_data_role_module_may_not_declare_a_class(make_source, config) -> None:
    assert not _clean(make_source, config, "class Thing:\n    pass\n", ModuleRole.DATA)


def test_test_stub_generated_and_barrel_roles_are_exempt(make_source, config) -> None:
    body = "class A:\n    pass\n\n\nclass B:\n    pass\n"
    for role in (
        ModuleRole.TEST,
        ModuleRole.STUB,
        ModuleRole.GENERATED,
        ModuleRole.BARREL,
    ):
        assert _clean(make_source, config, body, role)
