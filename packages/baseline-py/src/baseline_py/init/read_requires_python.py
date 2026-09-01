"""Read ``project.requires-python`` from a project's pyproject.toml."""

import tomllib
from pathlib import Path


def read_requires_python(project_root: Path) -> str:
    """Return the declared requires-python, or an empty string without one."""
    pyproject = project_root / "pyproject.toml"
    if not pyproject.is_file():
        return ""
    try:
        document = tomllib.loads(pyproject.read_text(encoding="utf-8"))
    except (tomllib.TOMLDecodeError, OSError, UnicodeDecodeError):
        return ""
    return str(document.get("project", {}).get("requires-python", ""))
