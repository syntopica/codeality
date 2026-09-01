"""Walk the configured roots and return the files to check."""

from pathlib import Path

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.traversal.gitignore_matcher import GitignoreMatcher
from baseline_py.traversal.walk_root import walk_root


def collect_source_files(config: BaselineConfig) -> tuple[Path, ...]:
    """Return the sorted Python files under the configured roots."""
    project_root = config.project_root.resolve()
    matcher = GitignoreMatcher.from_project(project_root) if config.respect_gitignore else None
    found: set[Path] = set()
    for root in (*config.source_roots, *config.test_roots):
        found.update(walk_root(project_root / root, project_root, matcher))
    return tuple(sorted(found))
