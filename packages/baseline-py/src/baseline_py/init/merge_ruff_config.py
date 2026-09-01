"""Merge the baseline ruff rules into an existing [tool.ruff] table."""

import tomlkit

from baseline_py.init.add_missing_rules import add_missing_rules
from baseline_py.init.read_asset import read_asset


def merge_ruff_config(pyproject_text: str) -> str:
    """Return the pyproject text with the baseline ruff rules merged in.

    Comments, key order and the layout of the rule arrays are preserved; the
    project's own selects and ignores are kept and extended, never replaced.
    """
    document = tomlkit.parse(pyproject_text)
    asset = tomlkit.parse(read_asset("ruff.toml"))
    tool = document.setdefault("tool", tomlkit.table(True))
    ruff = tool.setdefault("ruff", tomlkit.table())
    lint = ruff.setdefault("lint", tomlkit.table())
    add_missing_rules(lint, "select", [str(code) for code in asset["lint"]["select"]])
    add_missing_rules(lint, "ignore", [str(code) for code in asset["lint"]["ignore"]])
    per_file = lint.setdefault("per-file-ignores", tomlkit.table())
    for pattern, codes in asset["lint"]["per-file-ignores"].items():
        if pattern not in per_file:
            per_file[pattern] = codes
    if "pydocstyle" not in lint:
        lint["pydocstyle"] = asset["lint"]["pydocstyle"]
    return tomlkit.dumps(document)
