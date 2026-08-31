"""Collect the Python files under one root."""

import os
from pathlib import Path

from baseline_py.traversal.default_excludes import DEFAULT_EXCLUDES
from baseline_py.traversal.gitignore_matcher import GitignoreMatcher

SOURCE_SUFFIXES = (".py", ".pyi")


def walk_root(
    start: Path, project_root: Path, matcher: GitignoreMatcher | None
) -> list[Path]:
    """Return the files under ``start``, never following a directory symlink."""
    if not start.is_dir():
        return [start] if start.is_file() and start.suffix in SOURCE_SUFFIXES else []
    collected: list[Path] = []
    for directory, subdirectories, filenames in os.walk(start, followlinks=False):
        subdirectories[:] = [
            name for name in subdirectories if name not in DEFAULT_EXCLUDES
        ]
        for filename in filenames:
            path = Path(directory) / filename
            if path.suffix not in SOURCE_SUFFIXES:
                continue
            relative = path.relative_to(project_root).as_posix()
            if matcher is not None and matcher.is_ignored(relative):
                continue
            collected.append(path)
    return collected
