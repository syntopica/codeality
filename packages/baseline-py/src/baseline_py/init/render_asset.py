"""Fill a shipped asset's project-dependent values in."""

from pathlib import Path

from baseline_py.config.discover_source_roots import discover_source_roots
from baseline_py.config.discover_test_roots import discover_test_roots
from baseline_py.init.current_branch import current_branch
from baseline_py.init.first_party_packages import first_party_packages
from baseline_py.init.python_floor_minor import python_floor_minor
from baseline_py.init.read_requires_python import read_requires_python

# The lowest interpreter the quality group itself supports, and the newest one
# the shipped matrix exercises.
_LOWEST_MINOR = 11
_NEWEST_MINOR = 13


def render_asset(content: str, project_root: Path) -> str:
    """Return the asset text with discovered roots and packages substituted.

    When nothing can be discovered, the CHANGE_ME placeholder stays: an honest
    placeholder beats a guessed package name. The CI matrix and ruff's
    target-version follow the project's requires-python floor: a matrix cell
    below the floor fails on ``uv sync`` before the gate ever runs. The
    workflow listens on the branch the project is checked out on: two of the
    first eight adopters lived on ``master`` and on a feature branch, and a
    workflow watching ``main`` never ran for either.
    """
    roots = ", ".join(f'"{root}"' for root in discover_source_roots(project_root))
    rendered = content.replace('source-roots = ["src"]', f"source-roots = [{roots}]")
    tests = ", ".join(f'"{root}"' for root in discover_test_roots(project_root))
    rendered = rendered.replace('test-roots = ["tests"]', f"test-roots = [{tests}]")
    packages = first_party_packages(project_root)
    if packages:
        rendered = rendered.replace("CHANGE_ME", packages[0])
        rendered = rendered.replace(
            "respect-gitignore",
            f'import-package = "{packages[0]}"\nrespect-gitignore',
            1,
        )
    floor = python_floor_minor(read_requires_python(project_root))
    lowest = max(floor or _LOWEST_MINOR, _LOWEST_MINOR)
    minors = sorted({lowest, max(lowest, _NEWEST_MINOR)})
    matrix = ", ".join(f"'3.{minor}'" for minor in minors)
    rendered = rendered.replace("python-version: ['3.11', '3.13']", f"python-version: [{matrix}]")
    rendered = rendered.replace('target-version = "py311"', f'target-version = "py3{lowest}"')
    branch = current_branch(project_root)
    if branch:
        rendered = rendered.replace("branches: [main]", f"branches: [{branch}]")
    return rendered
