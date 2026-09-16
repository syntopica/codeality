"""Read the layout a pyproject.toml already declares."""

import tomllib
from pathlib import Path


def pyproject_layout_hints(
    project_root: Path,
) -> tuple[tuple[str, ...], tuple[str, ...]]:
    """Return the (source-roots, test-roots) the project itself declares.

    pytest's ``pythonpath`` and ``testpaths`` are the project telling its
    tools where the code lives, and hatch's wheel ``packages`` is the same
    statement to the build backend. A declaration beats a guess: firmware
    hosts keep their Python under ``host/src`` while ``pyproject.toml``
    sits at the repository root, where directory scanning sees nothing.
    """
    pyproject = project_root / "pyproject.toml"
    if not pyproject.is_file():
        return ((), ())
    try:
        document = tomllib.loads(pyproject.read_text(encoding="utf-8"))
    except (tomllib.TOMLDecodeError, OSError, UnicodeDecodeError):
        return ((), ())
    tool = document.get("tool", {})
    pytest_options = tool.get("pytest", {}).get("ini_options", {})
    sources = tuple(item for item in pytest_options.get("pythonpath", ()) if isinstance(item, str))
    if not sources:
        wheel = tool.get("hatch", {}).get("build", {}).get("targets", {}).get("wheel", {})
        sources = tuple(
            str(Path(item).parent)
            for item in wheel.get("packages", ())
            if isinstance(item, str) and "/" in item
        )
    tests = tuple(item for item in pytest_options.get("testpaths", ()) if isinstance(item, str))
    return (sources, tests)
