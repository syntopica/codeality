"""Walk the configured roots and return the files to check."""

import os
from pathlib import Path

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.traversal.default_excludes import DEFAULT_EXCLUDES
from baseline_py.traversal.gitignore_matcher import GitignoreMatcher

_SUFFIXES = (".py", ".pyi")


def collect_source_files(config: BaselineConfig) -> tuple[Path, ...]:
    """Return the sorted Python files under the configured roots.

    Directory symlinks are never followed, so a link out of the project cannot
    pull an unrelated tree into the scan.
    """
    project_root = config.project_root.resolve()
    matcher = GitignoreMatcher.from_project(project_root) if config.respect_gitignore else None
    found: set[Path] = set()
    for root in (*config.source_roots, *config.test_roots):
        found.update(_walk(project_root / root, project_root, matcher))
    return tuple(sorted(found))


def _walk(start: Path, project_root: Path, matcher: GitignoreMatcher | None) -> list[Path]:
    if not start.is_dir():
        return [start] if start.is_file() and start.suffix in _SUFFIXES else []
    collected: list[Path] = []
    for directory, subdirectories, filenames in os.walk(start, followlinks=False):
        subdirectories[:] = [name for name in subdirectories if name not in DEFAULT_EXCLUDES]
        for filename in filenames:
            path = Path(directory) / filename
            if path.suffix not in _SUFFIXES:
                continue
            relative = path.relative_to(project_root).as_posix()
            if matcher is not None and matcher.is_ignored(relative):
                continue
            collected.append(path)
    return collected
