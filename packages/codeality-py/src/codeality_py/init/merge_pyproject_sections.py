"""Merge the tables codeality-py owns into an existing pyproject.toml."""

from pathlib import Path

import tomlkit

from codeality_py.init.first_party_packages import first_party_packages
from codeality_py.init.merge_quality_group import merge_quality_group
from codeality_py.init.python_floor_minor import python_floor_minor
from codeality_py.init.read_asset import read_asset

OWNED_TABLES = ("deptry", "pytest", "coverage")
# The quality group carries syntopica-codeality-py, which needs Python 3.11.
MINIMUM_QUALITY_MINOR = 11


def merge_pyproject_sections(pyproject_text: str, project_root: Path) -> str:
    """Return the text with the owned tables added where they are absent.

    A table the project already declares is left exactly as it is: init adds
    what is missing and never rewrites what a project decided for itself.
    """
    document = tomlkit.parse(pyproject_text)
    asset = tomlkit.parse(read_asset("pyproject-sections.toml"))
    packages = first_party_packages(project_root)
    if packages:
        asset["tool"]["deptry"]["known_first_party"] = list(packages)
    tool = document.setdefault("tool", tomlkit.table(True))
    for name in OWNED_TABLES:
        if name not in tool and name in asset.get("tool", {}):
            tool[name] = asset["tool"][name]
    floor = python_floor_minor(str(document.get("project", {}).get("requires-python", "")))
    if floor is None or floor >= MINIMUM_QUALITY_MINOR:
        merge_quality_group(document, asset)
    return tomlkit.dumps(document)
