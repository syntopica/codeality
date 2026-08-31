"""Match a project-relative POSIX path against one glob pattern."""

from baseline_py.roles.compile_glob import compile_glob


def matches_glob(relative_path: str, pattern: str) -> bool:
    """Return whether the path matches the pattern.

    ``*`` stops at a directory separator and ``**`` crosses it, which is what
    every other tool means by a glob. ``fnmatch`` does not make that
    distinction: under it ``*.py`` matches ``pkg/module.py`` too, so a role
    meant for the scripts in a repository root silently claims the whole tree.
    """
    return compile_glob(pattern).match(relative_path) is not None
