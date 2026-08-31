"""Directory names never scanned, whatever the configuration says."""

DEFAULT_EXCLUDES: frozenset[str] = frozenset(
    {
        ".git",
        ".hg",
        ".svn",
        ".venv",
        "venv",
        "env",
        ".tox",
        ".nox",
        ".direnv",
        "site-packages",
        "__pycache__",
        ".mypy_cache",
        ".ruff_cache",
        ".pytest_cache",
        "build",
        "dist",
        ".eggs",
        "node_modules",
        "libdeps",
    }
)
