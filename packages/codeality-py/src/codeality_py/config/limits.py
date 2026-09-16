"""Numeric thresholds applied by the size rules."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Limits:
    """Code-line caps. Tests carry their own, looser cap."""

    max_file_lines: int = 150
    test_max_file_lines: int = 300
