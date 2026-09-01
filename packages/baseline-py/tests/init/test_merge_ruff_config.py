"""Merging extends a consumer's rule arrays without rewriting them."""

from baseline_py.init.merge_ruff_config import merge_ruff_config

_LEDGER = """\
[project]
name = "demo"

[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F"]
ignore = [
  # Conflicts with the formatter; shared baseline.
  "E501", "W191",

  # Adoption ratchet, 2026-09-01. 456 findings; fix a family, delete its line.
  "D1",       # 456 undocumented public modules, classes, methods, functions
  "PTH",      # 232 os.path call sites predating pathlib
]
"""


def test_a_commented_ledger_keeps_every_comment_and_its_order() -> None:
    merged = merge_ruff_config(_LEDGER)
    ignore = merged[merged.index("ignore = [") :]
    assert "# 456 undocumented public modules" in ignore
    assert "# 232 os.path call sites predating pathlib" in ignore
    assert ignore.index('"E501"') < ignore.index('"D1"') < ignore.index('"PTH"')


def test_the_missing_codes_land_on_their_own_line() -> None:
    merged = merge_ruff_config(_LEDGER)
    line = next(line for line in merged.splitlines() if '"D107"' in line)
    assert "added by baseline-py init" in line
    assert "# 232" not in line


def test_nothing_is_added_twice() -> None:
    once = merge_ruff_config(_LEDGER)
    assert merge_ruff_config(once) == once


def test_a_single_line_array_stays_on_one_line() -> None:
    merged = merge_ruff_config(_LEDGER)
    select = next(line for line in merged.splitlines() if line.startswith("select = "))
    assert '"RUF"' in select
    assert select.count("[") == 1
