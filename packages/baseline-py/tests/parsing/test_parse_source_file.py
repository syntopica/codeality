"""Parse failures are findings; read failures are infrastructure errors."""

from pathlib import Path

import pytest

from baseline_py.config.module_role import ModuleRole
from baseline_py.model.rule_code import RuleCode
from baseline_py.parsing.infrastructure_error import InfrastructureError
from baseline_py.parsing.parse_source_file import parse_source_file


def _write(tmp_path: Path, body: str) -> Path:
    path = tmp_path / "unit.py"
    path.write_text(body, encoding="utf-8")
    return path


def test_a_parsed_file_exposes_its_module_tree(tmp_path: Path) -> None:
    source = parse_source_file(_write(tmp_path, "x = 1\n"), "unit.py", ModuleRole.ORDINARY)
    assert source.tree is not None
    assert source.parse_error is None


def test_a_syntax_error_becomes_a_bpy000_finding(tmp_path: Path) -> None:
    source = parse_source_file(_write(tmp_path, "def broken(\n"), "unit.py", ModuleRole.ORDINARY)
    assert source.tree is None
    assert source.parse_error is not None
    assert source.parse_error.code is RuleCode.BPY000


def test_an_unreadable_file_raises_infrastructure_error(tmp_path: Path) -> None:
    missing = tmp_path / "gone.py"
    with pytest.raises(InfrastructureError):
        parse_source_file(missing, "gone.py", ModuleRole.ORDINARY)


def test_a_declared_encoding_is_honoured(tmp_path: Path) -> None:
    path = tmp_path / "unit.py"
    path.write_bytes(b"# -*- coding: latin-1 -*-\nname = 'caf\xe9'\n")
    source = parse_source_file(path, "unit.py", ModuleRole.ORDINARY)
    assert "café" in source.text
