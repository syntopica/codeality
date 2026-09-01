"""Extend a ruff rule array in place, keeping its order and comments."""

import re

import tomlkit
from tomlkit.items import Array

_INDENT = re.compile(r"\n([ \t]+)\S")


def add_missing_rules(lint: tomlkit.items.Table, key: str, incoming: list[str]) -> None:
    """Append the codes ``incoming`` adds to ``lint[key]``, and nothing else.

    A consumer's ignore list is often a dated ledger: each line a family of
    debt with the count found and the reason it is still there. Rebuilding
    the array from a set would keep every code and lose every comment, so
    the array is extended where it stands and its layout is left alone.
    """
    existing = lint.get(key)
    if not isinstance(existing, Array):
        lint[key] = sorted({*(existing or ()), *incoming}, key=str)
        return
    present = {str(item) for item in existing}
    missing = [code for code in incoming if code not in present]
    if not missing:
        return
    if "\n" not in existing.as_string():
        for code in missing:
            existing.append(code)
        return
    match = _INDENT.search(existing.as_string())
    indent = match.group(1) if match else "  "
    existing.add_line(*missing, indent=indent, comment="added by baseline-py init")
