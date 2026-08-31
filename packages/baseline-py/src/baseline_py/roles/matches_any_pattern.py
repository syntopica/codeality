"""Match a project-relative path against a set of globs."""

from baseline_py.roles.matches_glob import matches_glob


def matches_any_pattern(relative_path: str, patterns: tuple[str, ...]) -> bool:
    """Return whether the path matches any of the given glob patterns."""
    return any(matches_glob(relative_path, pattern) for pattern in patterns)
