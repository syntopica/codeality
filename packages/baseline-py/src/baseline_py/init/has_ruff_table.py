"""Detect ruff configuration already living in pyproject.toml."""

import tomllib
from pathlib import Path


def has_ruff_table(pyproject: Path) -> bool:
    """Return whether ``[tool.ruff]`` exists in this pyproject.toml.

    This decides the single most damaging thing init could do: ruff resolves
    one configuration file per directory, and a sibling ruff.toml silently
    takes precedence over [tool.ruff]. Writing one would discard the project's
    existing selects, ignores, excludes and per-file ignores without a word.
    """
    if not pyproject.is_file():
        return False
    try:
        document = tomllib.loads(pyproject.read_text(encoding="utf-8"))
    except (tomllib.TOMLDecodeError, OSError, UnicodeDecodeError):
        return False
    return "ruff" in document.get("tool", {})
