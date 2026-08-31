"""One parsed source file, with its role already decided."""

import ast
from dataclasses import dataclass

from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding


@dataclass(frozen=True, slots=True)
class SourceFile:
    """A file to check. ``tree`` is None exactly when ``parse_error`` is set."""

    relative_path: str
    role: ModuleRole
    text: str
    tree: ast.Module | None = None
    parse_error: Finding | None = None
