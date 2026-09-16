"""Add the quality dependency group when a project has none."""

import tomlkit


def merge_quality_group(document: tomlkit.TOMLDocument, asset: tomlkit.TOMLDocument) -> None:
    """Add ``[dependency-groups] quality`` in place, if it is absent.

    Config alone cannot make mypy, deptry, pytest-cov or pip-audit available,
    so the tools the gate requires are declared as real dependencies.
    """
    groups = document.setdefault("dependency-groups", tomlkit.table())
    if "quality" not in groups:
        groups["quality"] = asset["dependency-groups"]["quality"]
