# python-package

A Python package on the BusiRocket baseline: `src/` layout, uv, ruff, mypy
strict, deptry, pip-audit, pytest with coverage, and `baseline-py` for the
structural rules.

## Use it

```bash
uv sync --group quality
uv run baseline-py gate
```

`gate` runs the whole chain and fails if a required tool is missing, so a green
run means every check actually ran.

## What the layout demonstrates

- One primary declaration per module. `greeting.py` holds `Greeting` and the
  constant it needs, and nothing else.
- `__init__.py` is a barrel: imports and `__all__`, no logic.
- `cli.py` is declared an `entrypoint` in `baseline-py.toml`, which is how a
  command entry module keeps a name that describes it rather than its function.
