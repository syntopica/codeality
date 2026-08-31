"""Match a project-relative path against a set of globs."""

from fnmatch import fnmatch


def matches_any_pattern(relative_path: str, patterns: tuple[str, ...]) -> bool:
    """Return whether the path matches any of the given glob patterns."""
    return any(fnmatch(relative_path, pattern) for pattern in patterns)
