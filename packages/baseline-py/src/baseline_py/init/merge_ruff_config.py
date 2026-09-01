"""Merge the baseline ruff rules into an existing [tool.ruff] table."""

import tomlkit

from baseline_py.init.read_asset import read_asset
from baseline_py.init.union_of_rule_lists import union_of_rule_lists


def merge_ruff_config(pyproject_text: str) -> str:
    """Return the pyproject text with the baseline ruff rules merged in.

    Comments and key order are preserved; the project's own selects and
    ignores are kept and extended, never replaced.
    """
    document = tomlkit.parse(pyproject_text)
    asset = tomlkit.parse(read_asset("ruff.toml"))
    tool = document.setdefault("tool", tomlkit.table(True))
    ruff = tool.setdefault("ruff", tomlkit.table())
    lint = ruff.setdefault("lint", tomlkit.table())
    lint["select"] = union_of_rule_lists(lint.get("select"), asset["lint"]["select"])
    lint["ignore"] = union_of_rule_lists(lint.get("ignore"), asset["lint"]["ignore"])
    per_file = lint.setdefault("per-file-ignores", tomlkit.table())
    for pattern, codes in asset["lint"]["per-file-ignores"].items():
        if pattern not in per_file:
            per_file[pattern] = codes
    if "pydocstyle" not in lint:
        lint["pydocstyle"] = asset["lint"]["pydocstyle"]
    return tomlkit.dumps(document)
