"""Patterns that identify a test module.

``waveform_test.py`` in djplayerdeluxe is missed by a ``test_*.py``-only rule,
so the suffix form is part of the default set.
"""

TEST_FILE_PATTERNS: tuple[str, ...] = (
    "tests/**",
    "**/tests/**",
    "test_*.py",
    "**/test_*.py",
    "*_test.py",
    "**/*_test.py",
    "tests.py",
    "**/tests.py",
    "conftest.py",
    "**/conftest.py",
)
