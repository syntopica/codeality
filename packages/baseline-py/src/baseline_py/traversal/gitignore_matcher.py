"""Match paths against the project-root .gitignore.

Only the root .gitignore is read in v1; nested ignore files are not consulted.
"""

from fnmatch import fnmatch
from pathlib import Path


class GitignoreMatcher:
    """Decide whether a project-relative path is ignored by git."""

    def __init__(self, patterns: tuple[str, ...]) -> None:
        self._patterns = patterns

    @classmethod
    def from_project(cls, project_root: Path) -> "GitignoreMatcher":
        """Read the root .gitignore, returning an empty matcher when absent."""
        path = project_root / ".gitignore"
        if not path.is_file():
            return cls(())
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        return cls(
            tuple(line.strip() for line in lines if line.strip() and not line.startswith("#"))
        )

    def is_ignored(self, relative_path: str) -> bool:
        """Return whether git would ignore this path, honouring negation."""
        ignored = False
        for pattern in self._patterns:
            negated = pattern.startswith("!")
            candidate = pattern[1:] if negated else pattern
            if self._matches(candidate.rstrip("/"), relative_path):
                ignored = not negated
        return ignored

    @staticmethod
    def _matches(pattern: str, relative_path: str) -> bool:
        if pattern.startswith("/"):
            return fnmatch(relative_path, pattern.lstrip("/"))
        if "/" in pattern:
            return fnmatch(relative_path, pattern) or fnmatch(relative_path, f"**/{pattern}")
        segments = relative_path.split("/")
        return any(fnmatch(segment, pattern) for segment in segments)
