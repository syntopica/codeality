"""Shared helpers for building parsed source files in tests."""

import ast
from pathlib import Path

import pytest

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.module_role import ModuleRole
from baseline_py.parsing.source_file import SourceFile


@pytest.fixture
def make_source():
    """Return a factory building a SourceFile straight from a code string."""

    def factory(
        body: str,
        relative_path: str = "src/pkg/unit.py",
        role: ModuleRole = ModuleRole.ORDINARY,
    ) -> SourceFile:
        return SourceFile(
            relative_path=relative_path,
            role=role,
            text=body,
            tree=ast.parse(body, filename=relative_path),
        )

    return factory


@pytest.fixture
def config() -> BaselineConfig:
    """Return a default configuration rooted at a placeholder path."""
    return BaselineConfig(project_root=Path("/project"))
