"""Find the source roots of a project that does not declare them."""

from pathlib import Path

_SKIPPED = {"tests", "test", "docs", "scripts", "examples"}


def discover_source_roots(project_root: Path) -> tuple[str, ...]:
    """Return ``src`` when it exists, else every top-level import package.

    Projects such as ``atrium`` and ``memstore`` keep their package at the
    repository root rather than under ``src``, so a bare ``src`` default would
    silently scan nothing.
    """
    if (project_root / "src").is_dir():
        return ("src",)
    packages = sorted(
        entry.name
        for entry in project_root.iterdir()
        if entry.is_dir() and entry.name not in _SKIPPED and (entry / "__init__.py").is_file()
    )
    return tuple(packages) if packages else (".",)
