"""Infer the import packages a project provides as first party."""

from pathlib import Path

from baseline_py.config.discover_source_roots import discover_source_roots


def first_party_packages(project_root: Path) -> tuple[str, ...]:
    """Return the import-package names found under the discovered roots."""
    names: list[str] = []
    for root in discover_source_roots(project_root):
        base = project_root if root == "." else project_root / root
        if (base / "__init__.py").is_file():
            names.append(base.name)
        elif base.is_dir():
            names.extend(
                sorted(
                    entry.name
                    for entry in base.iterdir()
                    if entry.is_dir() and (entry / "__init__.py").is_file()
                )
            )
    return tuple(dict.fromkeys(names))
