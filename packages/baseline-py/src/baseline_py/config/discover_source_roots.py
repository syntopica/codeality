"""Find the source roots of a project that does not declare them."""

from pathlib import Path

from baseline_py.config.pyproject_layout_hints import pyproject_layout_hints

_SKIPPED = {"tests", "test", "docs", "scripts", "examples"}


def discover_source_roots(project_root: Path) -> tuple[str, ...]:
    """Return the declared layout, else ``src``, else top-level packages.

    Projects such as ``atrium`` keep their package at the repository root
    rather than under ``src``, so a bare ``src`` default would silently scan
    nothing; firmware hosts keep it under ``host/src``, which only their
    pyproject.toml can reveal.
    """
    declared, _ = pyproject_layout_hints(project_root)
    # A pythonpath of "." declares nothing the scan below would not find.
    hinted = tuple(root for root in declared if root != "." and (project_root / root).is_dir())
    if hinted:
        return hinted
    if (project_root / "src").is_dir():
        return ("src",)
    packages = sorted(
        entry.name
        for entry in project_root.iterdir()
        if entry.is_dir() and entry.name not in _SKIPPED and (entry / "__init__.py").is_file()
    )
    return tuple(packages) if packages else (".",)
