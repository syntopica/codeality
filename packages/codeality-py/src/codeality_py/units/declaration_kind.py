"""The syntactic forms that count as a primary declaration."""

from enum import StrEnum


class DeclarationKind(StrEnum):
    """What kind of declaration a counted top-level statement is."""

    CLASS = "class"
    FUNCTION = "function"
    TYPE_ALIAS = "type-alias"
