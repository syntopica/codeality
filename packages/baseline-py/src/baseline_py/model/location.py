"""A position inside a source file."""

from dataclasses import dataclass


@dataclass(frozen=True, order=True, slots=True)
class Location:
    """A project-root-relative POSIX path with a one-based position."""

    path: str
    line: int
    column: int
    end_line: int | None = None
    end_column: int | None = None
