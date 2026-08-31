"""Translate a glob pattern into the regular expression that matches it."""

import re
from functools import lru_cache

_TOKENS = re.compile(r"\*\*/|\*\*|\*|\?|\[[^\]]*\]|[^*?\[]+")
_TRANSLATIONS = {"**/": "(?:[^/]+/)*", "**": ".*", "*": "[^/]*", "?": "[^/]"}


@lru_cache(maxsize=512)
def compile_glob(pattern: str) -> re.Pattern[str]:
    """Return the compiled matcher for one glob pattern."""
    parts = [
        _TRANSLATIONS.get(token)
        or (token if token.startswith("[") else re.escape(token))
        for token in _TOKENS.findall(pattern)
    ]
    return re.compile(f"^{''.join(parts)}$")
