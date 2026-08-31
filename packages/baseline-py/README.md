# baseline-py

Structural linter and config scaffolder for Python: atomic files, placement,
size caps, no inline SQL. Brings the same discipline as
`@busirocket/eslint-config` and `cargo-baseline` to Python projects.

- **Design spec:**
  [docs/superpowers/specs/2026-08-31-python-baseline-design.md](https://github.com/BusiRocket/baseline/blob/main/docs/superpowers/specs/2026-08-31-python-baseline-design.md).

## Install

```bash
uv add --dev busirocket-baseline-py
```

## Usage

```bash
baseline-py init [--check|--apply|--force]  # scaffold ruff, mypy, deptry,
                                            # pytest, coverage and CI config
baseline-py check [PATH...]                 # run the structural rules
baseline-py gate                            # run the whole quality chain
baseline-py baseline create|update|check    # track migration debt
```

`init` never overwrites: it merges into existing configuration, or reports a
conflict. `check` never writes. `gate` fails when a required tool is absent
rather than skipping it.

## Rules

| Code     | Rule                | Enforces                                                       |
| -------- | ------------------- | -------------------------------------------------------------- |
| `BPY000` | `parse-error`       | A file that fails to parse is a finding, never a silent skip.  |
| `BPY001` | `one-primary-unit`  | Exactly one primary declaration per ordinary module.           |
| `BPY002` | `file-matches-unit` | File name is the snake_case of its primary declaration.        |
| `BPY003` | `no-grab-bag-names` | No `utils`, `helpers`, `misc` or `common` in any path segment. |
| `BPY004` | `max-file-lines`    | Code-line cap per file; tests get their own, looser cap.       |
| `BPY005` | `barrel-only-init`  | `__init__.py` holds imports, `__all__` and nothing else.       |
| `BPY006` | `no-inline-sql`     | SQL lives in resource files, not in string literals.           |

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| 0    | All blocking checks passed.                                     |
| 1    | Policy findings.                                                |
| 2    | Invalid usage or invalid configuration.                         |
| 3    | Infrastructure failure: a required tool is missing or unusable. |

## License

MIT
