# Python Baseline — Design

Date: 2026-08-31 Status: Approved (pending spec review)

## Goal

Bring the same discipline the TypeScript baseline and `cargo-baseline` enforce —
atomic files, one unit per file, name/unit agreement, size caps, no inline SQL,
no grab-bag modules — to the Python projects in the estate, as a package inside
this monorepo, strict enough that LLM-generated code cannot produce 8000-line
modules.

Evidence from the real projects (measured 2026-08-31):

- `memstore/memstore/mcp_server.py`: **8,698 lines** in one module, with its
  test file at 8,666 and `cli.py` at 3,655. This is the Python `sqlite_store.rs`
  — the same failure the Rust baseline was built to stop.
- `atrium/atrium/cli.py`: 482 lines; 63 Python files, 4,264 lines total.
- `consumer-b`: 56 files, 7,189 lines; `gui_forms/PyQt6/utils.py` is a
  grab-bag module, and `player_controls.py` is 570 lines.
- `multi-project-repo/consumer-w` and `multi-project-repo/consumer-c` each carry a
  `host/tests/helpers.py`.

Tooling already in place across `atrium`, `memstore` and `consumer-b`: uv
with a committed `uv.lock`, and `[tool.ruff]` in `pyproject.toml`. **No type
checker, no dependency-hygiene tool, no advisory audit in any of them.** uv and
ruff are therefore settled house tools; the gap is everything after them.

## Shape and distribution

New package: `packages/baseline-py/`, built with hatchling, developed with uv.

- Distribution name: `busirocket-baseline-py`
- Import package: `baseline_py`
- Executable: `baseline-py`

Published to PyPI through **Trusted Publishing (OIDC)** from a new
`.github/workflows/publish-python.yml`, mirroring the existing npm trusted
publishing: no API token, no `twine` credentials, no local login. The
trusted-publisher entry on pypi.org must name organization `BusiRocket`,
repository `baseline`, workflow `publish-python.yml`, no environment.

### Why one package, not two, and not a separate repo

Python has no ESLint-style config resolution from an installed package. Ruff's
`extend` and Pyright's `extends` accept a **path to a local file**, not a
package name; PEP 735 `[dependency-groups]` is project-local and build backends
must not expose it as installed distribution metadata. A wheel _can_ ship TOML
assets and hand their absolute paths to tools via `importlib.resources`, so
scaffolding is a deliberate UX choice rather than a technical necessity — but it
is the transparent one: the consuming repo owns readable config it can diff.

Two packages (config + linter) would mirror the `eslint-config` /
`eslint-plugin-code-policy` split, but they express one policy, always install
together, and would double the release, changelog and CI surface for a
five-project estate. A separate repository would drop out of `release:check`,
the estate sweep and the shared dependency-update flow.

## Commands

```
baseline-py init [--ci] [--profile lib|app]
baseline-py check [PATH]
baseline-py gate [PATH]
```

**`init`** scaffolds the assets into a consumer project. Idempotent and
non-destructive: it writes its own files whole (`ruff.toml`, `mypy.ini`,
`baseline-py.toml`, optionally `.importlinter` and the CI workflow) and merges
only the sections it owns into an existing `pyproject.toml` (`[tool.deptry]`,
`[tool.pytest.ini_options]`, `[tool.coverage.report]`). It never rewrites a
`pyproject.toml` wholesale, and it reports what it changed.

**`check`** runs the structural rules over `PATH` (default `.`), emitting
`file:line: error[rule-name] message` diagnostics. Exit code non-zero on any
error-severity finding; tips never affect it. `--format json` emits
machine-readable findings.

Adoption mode: `check --write-baseline` records existing violations to
`.baseline-py-baseline.json`; subsequent runs report them as informational and
fail only on new ones. This exists because `memstore` alone would emit hundreds
of findings on day one, and the alternative — sprinkling suppressions through
the codebase — hides the debt instead of tracking it.

**`gate`** runs the full chain in order, failing at the first error:
`ruff check`, `ruff format --check`, `mypy`, `baseline-py check`, `deptry`,
`pip-audit`, `pytest` with the coverage threshold. It is the local equivalent of
the repo's `pnpm check:ci`, and the CI workflow calls it so the chain is defined
once rather than duplicated in every consumer's workflow. Each step is skipped
with a notice when its tool is absent, so `gate` degrades rather than breaks on
a partially adopted project.

## Structural rules (v1)

None of these exist in ruff. Verified against the current rule index: `PLR0904`
counts public methods on a class, not public symbols in a module; `N999` only
validates that a module name is snake_case, never comparing it to the symbol
inside; `A005` only catches stdlib shadowing, not grab-bag names; `E501` limits
line width, not file length; `S608` catches SQL built by string concatenation,
deliberately permitting a static parameterized literal.

| Rule                | Enforces                                                                                                                                                                                                  | Kind |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `one-primary-unit`  | One public module-level symbol (class, function, type alias) per file. Its methods, decorators and `@overload` stubs stay with it. Private module-level helper functions are banned — extract and import. | AST  |
| `file-matches-unit` | File name must be the snake_case of its primary symbol (`user_repository.py` → `UserRepository`).                                                                                                         | AST  |
| `no-grab-bag-names` | `utils.py`, `helpers.py`, `misc.py`, `common.py` banned outright, at any depth.                                                                                                                           | path |
| `max-file-lines`    | Hard cap on code lines per file; blank lines, comments and docstrings do not count. Default 150, configurable.                                                                                            | text |
| `barrel-only-init`  | `__init__.py` holds only imports, `from … import …` re-exports and `__all__`. Zero executable definitions or statements.                                                                                  | AST  |
| `no-inline-sql`     | SQL string literals (`SELECT`, `INSERT INTO`, `UPDATE`, `DELETE FROM`, `CREATE TABLE`, …) banned in `.py` files. SQL lives in `sql/*.sql`, loaded through `importlib.resources`.                          | AST  |

Test exemption: files under `tests/` and files matching `test_*.py` /
`conftest.py` are exempt from `one-primary-unit`, `file-matches-unit` and
`max-file-lines`, mirroring the TypeScript and Rust carve-outs.
`no-grab-bag-names` still applies — `tests/helpers.py` exists in two projects
and is exactly the pattern to stop.

Kind matters for implementation: `no-grab-bag-names` is a path check and
`max-file-lines` a text check. Only the other four parse with `ast`.

## Tips (advisory, non-blocking)

Emitted in a `tip[...]` section after errors, never affecting the exit code:

- **broad-except density** — `except Exception:` / bare `except:` past a
  threshold suggests introducing typed exceptions.
- **print-over-logging** — `print()` outside a CLI entrypoint module.
- **untyped-dict-payload** — repeated `dict[str, Any]` in signatures suggests a
  dataclass or a Pydantic model.

## Configuration

`baseline-py.toml` in the consumer repo, mirroring `baseline.toml`:

```toml
# baseline-py configuration — https://github.com/BusiRocket/baseline
max_file_lines = 150
package_max_files = 75
package_max_lines = 8000
broad_except_density = 10
disabled_rules = []
disabled_tips = []
```

Suppression policy: rule codes are stable and documented; suppression is
per-line (`# baseline-py: ignore[rule-name]`) or per-path in `baseline-py.toml`,
and the adoption baseline file is the only bulk mechanism — there is no blanket
silent ignore.

## Scaffolded assets

**`ruff.toml`** — lint, format and import sorting. Selected:
`E, W, F, I, N, UP, B, A, C4, DTZ, T20, SIM, RET, ARG, PTH, ERA, PL, RUF, D`,
plus a curated subset of `S` (bandit) rather than the whole set, which is
intentionally noisy in tests and subprocess-heavy code. `per-file-ignores`
relaxes `D`, `S101` and `ARG` under `tests/`. Enabling `D100`–`D107` removes any
need for `interrogate`; enabling `C901`, `PLR0912`, `PLR0915` removes any need
for `radon` or `xenon`.

**`mypy.ini`** — `strict = true`, explicit `python_version`, per-module
`ignore_missing_imports` only where a third-party package genuinely ships no
stubs.

**`pyproject.toml` sections** — `[tool.deptry]` (DEP001 missing, DEP003
transitive, DEP004 dev-in-prod), `[tool.pytest.ini_options]`,
`[tool.coverage.report]` with `fail_under`.

**`.importlinter`** — only under `--profile app`, and only when the project
declares real layers. Not scaffolded by default.

**`.github/workflows/baseline-py.yml`** — `uv lock --check`, `uv sync --locked`,
then `baseline-py gate`, over a matrix of the minimum supported Python and the
latest stable. For publishable projects it additionally builds the wheel and
sdist and imports from the built wheel rather than the source checkout.

## Type checking

**mypy strict is the blocking gate.** Predictable, mature stubs and plugin
ecosystem, diagnostics developers already read, and mypy 2.x is actively
developed.

Not pyright: its maintainer states publicly that it is maintained "with fewer
people", that Eric Traut is no longer full time, that Pylance prioritises being
a language server over a type checker, and that "type checking issues will
likely take a lot longer to be fixed". Not `ty`: still `0.0.x`, with explicitly
unstable diagnostics and 53% typing-spec conformance. Not pyrefly _yet_: it is
genuinely production-ready since 1.0 (May 2026, default on Instagram's 20M-line
codebase, adopted by PyTorch, NumPy and JAX) and dramatically faster, but its
own version policy admits that ordinary releases may introduce new errors, which
would break a blocking gate without warning.

**Pyrefly runs in shadow**: the CI workflow includes a non-blocking
`continue-on-error` pyrefly step so the estate accumulates real measurements —
runtime, memory, and which mypy findings it disagrees with — and the eventual
switch is decided on data rather than on release notes. The shadow step is
revisited once there is a quarter of evidence.

## Division of responsibility

`baseline-py check` implements **only** what nothing else covers. Everything
else is delegated and stays delegated:

| Concern                        | Owner                                       |
| ------------------------------ | ------------------------------------------- |
| Lint, format, import order     | ruff                                        |
| Complexity, docstring coverage | ruff (`C901`, `PLR0912`, `PLR0915`, `D1xx`) |
| Security patterns              | ruff (curated `S` subset)                   |
| Types                          | mypy strict (pyrefly shadow)                |
| Dependency hygiene             | deptry                                      |
| Known advisories               | pip-audit                                   |
| Tests and coverage             | pytest + coverage                           |
| Reproducibility                | uv (`uv lock --check`, `uv sync --locked`)  |
| Structural house rules         | `baseline-py check`                         |

Deliberately excluded from v1: `radon`/`xenon` (covered by ruff), `interrogate`
(covered by ruff `D1xx`), `import-linter` (only where real layers exist), a
plugin framework inside `baseline-py` (stable rule codes, per-path ignores and
deterministic output are enough). `vulture` (dead code) and `jscpd`
(duplication) are worth having but start **advisory**: vulture's false positives
on decorators, registries and framework entrypoints are expensive, and jscpd's
Python noise must be calibrated against the five real repositories before it can
block.

## Template

One new template: `templates/python-package` — `src/` layout, uv with a
committed `uv.lock`, `pyproject.toml` with hatchling, the full scaffolded asset
set, a passing example module and test, and the CI workflow. It covers the shape
the estate actually has (libraries and CLIs). A `fastapi-app` template is not
built until a real HTTP service exists in `~/p` to consume it.

## Rollout and verification

Success criterion for each stage is a command that must pass.

1. Package skeleton and `check` rules, dogfooded on `packages/baseline-py`'s own
   source — verify: `baseline-py check packages/baseline-py` clean.
2. `init` and the asset set — verify: `init` into a scratch copy of `atrium`
   produces a repo where `baseline-py gate` runs end to end.
3. Estate pass over `atrium`, `memstore`, `consumer-b`,
   `multi-project-repo/consumer-w/host`, `multi-project-repo/consumer-c/host` — verify: each
   produces a findings report; adoption baselines recorded, nothing else changed
   in those repos without a separate decision. Vendored trees (`.pio/libdeps/`,
   `.venv/`, `site-packages/`) are excluded from scanning.
4. Template — verify: fresh scaffold passes `baseline-py gate` from zero.
5. Publish — verify: `gh workflow run publish-python.yml`, then the package
   installs from PyPI into a clean environment and `baseline-py --version`
   reports the released version.

## Open questions

None blocking. Two to revisit after the estate pass: the default
`max_file_lines` (150 matches Rust, but Python's density differs — the estate
pass gives the real distribution), and whether `vulture` and `jscpd` graduate
from advisory to blocking.
