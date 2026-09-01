"""Merge the tables baseline-py owns into an existing pyproject.toml."""

from pathlib import Path

import tomlkit

from baseline_py.init.first_party_packages import first_party_packages
from baseline_py.init.merge_quality_group import merge_quality_group
from baseline_py.init.read_asset import read_asset

OWNED_TABLES = ("deptry", "pytest", "coverage")


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
    merge_quality_group(document, asset)
    return tomlkit.dumps(document)
