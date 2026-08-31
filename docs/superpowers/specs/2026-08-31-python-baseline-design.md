# Python Baseline — Design

Date: 2026-08-31 Status: Approved (revised after adversarial review)

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
  `host/tests/helpers.py`, and their Python project metadata sits at the
  repository root while sources live under `host/src` and `host/tests`.

Tooling already in place: uv with a committed `uv.lock` and `[tool.ruff]` in
`pyproject.toml` in `atrium`, `memstore` and `consumer-b`. `memstore`
additionally declares `mypy>=1.0` and `pytest-cov` in its dependency groups, run
ad hoc with no CI gate. Nothing in the estate has dependency-hygiene checking or
an advisory audit. uv and ruff are settled house tools; adoption must therefore
**merge with existing configuration, never assume a blank slate**.

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
baseline-py init [--check] [--apply] [--force] [--ci] [--profile lib|app]
baseline-py check [PATH...] [--format text|json] [--fail-fast]
baseline-py baseline create|update|check
baseline-py gate [--fail-fast] [--json]
```

### `init` — merge or refuse, never shadow

Three modes with a fixed contract:

- **plan (default, and `--check`)** — prints every managed path with its
  disposition: `create`, `merge`, `conflict`, `unchanged`. Writes nothing. Exit
  2 on any conflict under `--check`.
- **`--apply`** — performs creates and non-conflicting merges only. A managed
  file that exists and differs semantically is reported as a conflict and left
  alone.
- **`--force`** — replaces conflicting managed files. Never the default.

The critical constraint, found by review against the real repos: **ruff resolves
exactly one configuration file per directory, and a sibling `ruff.toml` takes
precedence over `[tool.ruff]` in `pyproject.toml` without merging.** Writing a
fresh `ruff.toml` into `atrium`, `memstore` or `consumer-b` would silently
discard their existing selects, ignores, excludes, target version and per-file
ignores. `init` therefore edits the existing `[tool.ruff]` table in place with
comment- and order-preserving TOML editing (`tomlkit`), or refuses with a
conflict report. It writes a standalone `ruff.toml` only when the project has no
ruff configuration at all.

`init` also owns dependency installation, not just config: it adds a PEP 735
`[dependency-groups] quality` group with pinned constraints for the tools the
gate requires, and reports that the lock must be regenerated. Config files alone
cannot make `mypy`, `deptry`, `pytest-cov` or `pip-audit` available, and
`uv lock --check` immediately after a config-only init would correctly fail.

### `check` — read-only, always

Runs the structural rules over the configured roots. Never writes, never touches
the baseline. Text output is `path.py:12:1: BPY001 one-primary-unit: <message>`;
`--format json` emits a versioned document on stdout with logs on stderr. Runs
every rule by default and reports the full set; `--fail-fast` is opt-in.

### `baseline` — migration debt, tracked explicitly

`baseline create` / `baseline update` are the only writers. `baseline check`
reports `new`, `known` and `resolved` counts. A baseline is not an ignore file:
it records debt with a fingerprint, and stale entries are surfaced rather than
retained forever.

### `gate` — required stages fail, they do not skip

Runs, in order: `ruff check`, `ruff format --check`, `mypy`,
`baseline-py check`, `deptry`, `pip-audit`, and `pytest` with coverage
collection. By default it runs **every independent stage** and returns a
combined summary; `--fail-fast` stops at the first failure. A **required stage
whose tool is absent is an infrastructure failure (exit 3), never a skip** — a
green gate must mean the gate ran. Only stages declared optional or shadow may
be skipped, and the JSON output states why.

Each stage reports: name, required/optional/shadow, command and tool version,
duration, status (`passed`, `findings`, `failed-to-run`,
`skipped-not-applicable`), exit code, artifact path.

Concrete stage commands, because the underspecified versions do nothing:

- Coverage is **collected**, not merely configured:
  `pytest --cov=<import-package> --cov-report=term-missing --cov-fail-under=<n>`.
  The import package comes from configuration; it is not inferred from the
  repository name.
- `pip-audit` audits the **locked project** (`pip-audit --locked .`, or a
  deterministic lock export), not whatever happens to be in the ambient
  environment.
- Roots are explicit. `multi-project-repo/consumer-w` and `multi-project-repo/consumer-c`
  keep `pyproject.toml` at the repository root with sources under `host/src`, so
  every child tool receives the same project root and the configured source and
  test roots, rather than being pointed at a directory.

## Structural rules (v1)

None of these exist in ruff. Verified against the current rule index: `PLR0904`
counts public methods on a class, not public symbols in a module; `N999` only
validates that a module name is snake_case, never comparing it to the symbol
inside; `A005` only catches stdlib shadowing, not grab-bag names; `E501` limits
line width, not file length; `S608` catches SQL built by string concatenation,
deliberately permitting a static parameterized literal.

| Code     | Rule                | Enforces                                                                                                                               |
| -------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `BPY000` | `parse-error`       | A source file that fails to parse is a finding, never a silent skip.                                                                   |
| `BPY001` | `one-primary-unit`  | Exactly one primary declaration per ordinary module (full procedure below).                                                            |
| `BPY002` | `file-matches-unit` | File name is the snake_case of the sole counted declaration, in ordinary modules only.                                                 |
| `BPY003` | `no-grab-bag-names` | `utils`, `helpers`, `misc`, `common` banned as a file stem **or any package path segment**, case-insensitively, matched as full names. |
| `BPY004` | `max-file-lines`    | Cap on occupied non-comment lines. Default 150; tests get their own cap, default 300.                                                  |
| `BPY005` | `barrel-only-init`  | `__init__.py` conforms to the barrel grammar below.                                                                                    |
| `BPY006` | `no-inline-sql`     | SQL-shaped string literals banned in `.py`; queries live in configured resource globs.                                                 |

Rule codes are immutable and never reused. An incompatible semantic change
allocates a new code or bumps the config/baseline schema with a migration.

### Module roles — assigned before any rule runs

Counting declarations before classifying the file is what produces a
false-positive swamp. Exactly one role is assigned per file, in this precedence:

`excluded` → `generated` → `stub` → `test` → `namespace-init` → `barrel` →
configured `entrypoint` / `data` / `registry` → `ordinary`.

Two configured roles claiming the same file is a configuration error (exit 2),
not first-match-wins. Roles are declared explicitly in configuration; none is
inferred from file content.

| Role             | `BPY001`                                                            | Other rules                                               |
| ---------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| `ordinary`       | Exactly one public primary; no other declaration, private included. | All rules apply.                                          |
| `data`           | Zero primaries. Imports, typed constants, static collections only.  | `BPY002` exempt; line and SQL rules apply.                |
| `registry`       | Multiple decorated declarations allowed.                            | `BPY001`/`BPY002` exempt; line and SQL rules apply.       |
| `entrypoint`     | One entry function plus a `__main__` guard.                         | `BPY002` exempt; line and SQL rules apply.                |
| `barrel`         | Not counted; barrel grammar governs.                                | `BPY005` applies; `BPY002` inapplicable.                  |
| `namespace-init` | Not counted.                                                        | `BPY005` exempt for that exact file.                      |
| `test`           | Exempt; fixtures and test classes legitimately group.               | `BPY003`, SQL policy and the test line cap still apply.   |
| `stub` (`.pyi`)  | Exempt.                                                             | All six exempt in v1; mypy remains authoritative.         |
| `generated`      | Exempt.                                                             | All six exempt; the matched generated reason is reported. |
| `excluded`       | Not scanned at all.                                                 | Traversal policy, not suppression.                        |

Test detection covers `tests/**`, `test_*.py`, `*_test.py`, `tests.py` and
`conftest.py` — `consumer-b/waveform_test.py` is missed by a
`test_*.py`-only pattern. Generated defaults cover Django migrations,
`*_pb2.py`, `*_pb2_grpc.py`, `ui_*.py`, `*_ui.py`, `resources_rc.py`, plus
configured globs and a recognised generated-file marker. Generated status is
never inferred from size.

### `BPY001` one-primary-unit — decision procedure

The counted concept is a **primary declaration**, defined syntactically. It is
deliberately _not_ "one public Python symbol": without a static `__all__`,
imported names and every non-underscore assignment are public too, and enforcing
that would swamp every repository in the estate. The spec says so plainly rather
than implying Python visibility semantics.

1. Resolve the path relative to the project root, POSIX, without following
   symlinks outside the root. Apply exclusions first.
2. Assign the module role by the precedence above.
3. Parse. A syntax failure emits `BPY000`; an interpreter or internal parser
   failure is an infrastructure exit. Never skip an unparseable file silently.
4. Collect top-level candidates: `ClassDef`, `FunctionDef`, `AsyncFunctionDef`,
   PEP 695 `type` statements, `X: TypeAlias = ...`, and `X = NewType(...)`. A
   plain `Alias = list[str]` is too ambiguous to infer in v1 and does not count.
5. Determine visibility: with a static literal `__all__`, membership decides the
   intended public API; otherwise a non-underscore bound name is public.
   Visibility feeds diagnostics and `BPY002` — it never erases extra
   definitions.
6. Coalesce only the defined compound forms: an `@overload` family (consecutive
   same-name overloads plus exactly one implementation) is one declaration;
   private `_` handlers registered on a **locally defined** `singledispatch`
   primary accompany it.
7. Evaluate: an ordinary module holds exactly one public primary declaration and
   no other top-level class, function or type declaration, public or private.
   Zero primaries is a violation unless the role permits it.
8. Validate companions against the grammar below.
9. Emit one file-level diagnostic anchored on the first offending declaration,
   with related locations for the rest — not N pairwise errors.

**Companion grammar for an ordinary module.** Allowed beside the sole primary:
module docstring; `from __future__` and ordinary imports; a static literal
`__all__`; import-only `if TYPE_CHECKING:` blocks; constants, logger objects,
caches, sentinels and metadata assignments; the primary's overload declarations;
private `_` `singledispatch` handlers of a local primary; and an
`if __name__ == "__main__":` guard that calls an already-defined entry function.

Not allowed: any second class, function or explicit type alias, **even
private**; a public decorated route, command, fixture or registration callback;
a named `singledispatch` implementation or a registration on an imported
dispatcher; declarations pushed under a top-level conditional to evade the scan.

**Symbol decision table.**

| Construct in an ordinary module                          | Primary?  | May accompany?  | Note                                          |
| -------------------------------------------------------- | --------- | --------------- | --------------------------------------------- |
| Public `class`, `def`, `async def`                       | Yes       | No              | Core counted form.                            |
| `@dataclass` class                                       | Yes       | No              | Generated methods are irrelevant.             |
| `Protocol`, ABC                                          | Yes       | No              | Class semantics still apply.                  |
| `Enum`, `TypedDict`, class `NamedTuple`                  | Yes       | No              | Each is a primary type declaration.           |
| PEP 695 `type Alias = …`, `X: TypeAlias`, `NewType(...)` | Yes       | No              | Explicit type declarations.                   |
| Plain `Alias = list[str]`                                | No        | Yes             | Not inferred in v1.                           |
| Imports, including re-export imports                     | No        | Yes             | Public in Python, not primary here.           |
| Constant, logger, cache, sentinel                        | No        | Yes             | Constant-only files need the `data` role.     |
| Static literal `__all__`                                 | No        | Yes             | Cannot hide declarations from counting.       |
| Overload family + one implementation                     | One       | Yes, as a group | Malformed groups are rejected.                |
| Local `@singledispatch` base                             | Yes       | —               | The dispatcher is the primary.                |
| `@local.register def _(…)`                               | No        | Yes             | Private handlers only.                        |
| `@local.register def handle_int(…)`                      | Yes       | No              | Independently addressable.                    |
| Registration on an imported dispatcher                   | Yes       | No              | Use the `registry` role if intentional.       |
| `@app.route`, `@click.command` function                  | Yes       | No              | Decoration does not erase the declaration.    |
| `@pytest.fixture` in a test-role file                    | Exempt    | Yes             | The test role owns the carve-out.             |
| Private `def _helper` / `class _Helper`                  | Secondary | No              | A real violation; extract it.                 |
| Nested method or local function                          | No        | Yes             | Belongs to the enclosing unit.                |
| `if TYPE_CHECKING:` with imports                         | No        | Yes             | Imports only inside the block.                |
| `if __name__ == "__main__": main()`                      | No        | Yes             | Calls an existing entrypoint.                 |
| Django `models.py` with several models                   | Several   | No              | Genuine debt, or an explicit configured role. |
| Django `apps.py` with one `AppConfig`                    | One       | Yes             | Needs a configured `BPY002` exception.        |
| Migrations, generated Qt, protobuf                       | Exempt    | —               | Matched as `generated` before parsing.        |
| Hand-written Qt widget                                   | Yes       | Normal rules    | Importing Qt is not an exemption.             |
| `.pyi` stub                                              | Exempt    | —               | Stubs aggregate declarations by design.       |

A `models.py` holding ten dataclasses is architectural debt, not a parser false
positive. It is fixed by migrating to `models/<model>.py` with a barrel, or by
an explicit, visible role during adoption — never by a silent exemption.

### `BPY002` file-matches-unit

One documented CamelCase-to-snake_case algorithm with fixtures, so
`HTTP2Client`, `OAuthClient` and `IPv6Address` cannot differ between
implementations. Applies to the sole counted declaration in ordinary modules
only; barrels, data, entrypoints, registries, tests, stubs and generated files
are exempt by role.

### `BPY004` max-file-lines

Counted from token and AST spans: every occupied non-comment line, except true
module, class and function docstring spans. Decorators count. Every physical
line of an assigned multiline string counts. A parse failure emits `BPY000`
rather than being skipped.

Tests are **not** exempt — the motivating evidence includes an 8,666-line test
file, and exempting tests would preserve the largest demonstrated failure. They
get a separate, looser cap (`test-max-file-lines`, default 300).

### `BPY005` barrel-only-init

Allowed grammar: an optional module docstring, `from __future__` and import
statements, import-only `if TYPE_CHECKING:` blocks, `__version__`, and a static
literal `__all__`. Assignments beyond those and any call are rejected. A barrel
executes its imports, so the spec claims "no declarations and no module-scope
calls", not the false "zero executable statements". Native namespace packages
have no `__init__.py` and need no exception; legacy `pkgutil` / `pkg_resources`
initialisation is the explicit `namespace-init` role.

### `BPY006` no-inline-sql

Substring matching would flag "select an option" and miss f-strings and implicit
concatenation. Detection inspects `Constant` and `JoinedStr` nodes after Python
has joined implicit concatenation, normalises whitespace, and requires a
SQL-shaped token sequence: `SELECT … FROM`, `INSERT … INTO`, `UPDATE … SET`,
`DELETE … FROM`, or DDL plus an object keyword. Real docstrings are excluded;
arbitrary strings are not.

Queries live in configured resource globs (default `sql/**/*.sql`) loaded
through a configurable loader — the rule requires externalised queries without
dictating one hard-coded directory or one loader API. Whether test fixture SQL
is enforced is an explicit configuration decision, never an accident.

## Configuration

`baseline-py.toml`, versioned. Unknown keys, invalid globs, overlapping roles
and unsupported schema versions are fatal (exit 2) — a typo must never silently
fall back to defaults.

```toml
schema-version = 1
source-roots = ["src"]
test-roots = ["tests"]
respect-gitignore = true

[limits]
max-file-lines = 150
test-max-file-lines = 300

[roles]
data = ["src/pkg/constants.py"]
registry = ["src/pkg/routes/*.py"]
entrypoint = ["src/pkg/__main__.py", "src/pkg/cli.py"]
generated = ["**/migrations/*.py", "**/*_pb2.py", "**/ui_*.py"]
namespace-init = []

[[overrides]]
paths = ["legacy/**"]
disable = ["BPY001", "BPY002"]
reason = "Tracked migration boundary"
```

Broad overrides require a reason. Roles are preferred over suppressions: a role
states what a file _is_, a suppression only silences an alarm.

The `package_max_files` and `package_max_lines` fields from the first draft are
**removed** — they had no corresponding rule. Dead configuration is worse than
missing configuration, because adopters believe it is enforced.

## Traversal

Scan only the configured source and test roots rather than crawling the
repository and subtracting names. Never follow directory symlinks outside those
roots. Root-relative POSIX glob semantics with tested `**` behaviour. Default
excludes: `.git`, `.hg`, `.svn`, `.venv`, `venv`, `env`, `.tox`, `.nox`,
`.direnv`, `site-packages`, `__pycache__`, `.mypy_cache`, `.ruff_cache`,
`.pytest_cache`, `build`, `dist`, `.eggs`, `node_modules`, `.pio/libdeps`.
`.gitignore` is honoured by default with an explicit include override; the
built-in vendor excludes are not overridable unless configuration opts in.
Verbose and JSON output report the selected roots and excluded-path counts, so a
green run cannot hide that the real source tree was never scanned.

`generated` stays distinct from `excluded`: generated first-party files are
inventoried but receive no structural findings.

## Diagnostic and exit contracts

Frozen before CI or any baseline consumes them.

**JSON**: a versioned top-level object with metadata, findings and summary. Each
finding carries schema version, tool name and version, rule code, slug,
severity, message, project-relative POSIX path, 1-based start line/column and
optional end, a semantic subject (the declaration name), related locations,
baseline state (`new` / `known` / `resolved`) and a versioned fingerprint. JSON
goes to stdout alone; progress and logs to stderr. Sorted by path, then
location, then code.

**Exit codes**:

| Code | Meaning                                                                                       |
| ---- | --------------------------------------------------------------------------------------------- |
| 0    | All blocking checks passed. Shadow findings may exist and are reported.                       |
| 1    | Policy findings, including new structural findings and `BPY000` source syntax errors.         |
| 2    | Invalid usage, or invalid/unsupported configuration.                                          |
| 3    | Infrastructure failure: missing required executable, unsupported runtime, child process fail. |

The aggregator preserves the distinction in its summary. A skipped required tool
can never produce exit 0. Baselines and inline suppressions suppress **policy
findings only** — never configuration errors, parser failures, missing tools or
internal failures.

## Baseline and suppression semantics

- Stores schema version, checker version, config digest and the project-root
  convention.
- Fingerprints on `(rule code, relative path, semantic subject / context hash)`
  — never on line number or full message. Repeated SQL findings include a
  normalised AST-context hash, so inserting a line does not invalidate every
  query while a genuinely new query is still detected.
- `check` is read-only; only `baseline create` / `baseline update` write,
  atomically and deterministically.
- Current findings are classified `new` or `known`; baseline entries with no
  current finding are `resolved` / stale. CI fails on new findings, and on stale
  entries under `--check-stale`, so dead debt is not retained forever.
- Editing a file does not forgive its old findings.
- An incompatible fingerprint or schema version exits 2 with an upgrade command,
  rather than silently reclassifying everything.

Inline suppression grammar: `# baseline-py: ignore[BPY006]` on the same
statement, `# baseline-py: ignore-file[BPY001]` on the first code line with a
required reason. Precedence with per-path config and the baseline is defined,
and unused or malformed suppressions are reported. A file-level topology rule
cannot honestly hang off an arbitrary line-end comment without this explicit
scope.

## Scaffolded assets

**ruff** — merged into the project's existing configuration. Selected:
`E, W, F, I, N, UP, B, A, C4, DTZ, T20, SIM, RET, ARG, PTH, ERA, PL, RUF, D`,
plus a curated subset of `S` (bandit) rather than the whole set, which is
intentionally noisy in tests and subprocess-heavy code. `per-file-ignores`
relaxes `D`, `S101` and `ARG` under tests. `D100`–`D107` removes any need for
`interrogate`; `C901`, `PLR0912`, `PLR0915` remove any need for `radon` or
`xenon`. The rule list is explicit — never `ALL`, which expands silently on
every ruff upgrade — and the formatter-conflicting rules stay in a named ignore
set.

**mypy** — `strict = true`, with the exact command, config discovery, Python
version, package roots, and the policy for untyped third-party imports all
stated. `strict = true` alone does not define how multiple source roots are
invoked.

**`pyproject.toml` sections** — `[tool.deptry]` (DEP001 missing, DEP003
transitive, DEP004 dev-in-prod), `[tool.pytest.ini_options]`,
`[tool.coverage.report]`, and a PEP 735 `[dependency-groups] quality` with
pinned tools.

**`.importlinter`** — only under `--profile app`, only where real layers exist.
Not scaffolded by default.

**`.github/workflows/baseline-py.yml`** — `uv lock --check`, `uv sync --locked`,
then `baseline-py gate`, over a matrix of the minimum supported Python and the
latest stable. For publishable projects it also builds the wheel and sdist and
imports from the built wheel rather than the source checkout.

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

**Pyrefly runs as instrumented shadow telemetry**, not a `continue-on-error`
line that produces an ephemeral log. It is pinned, run over the same roots and
Python version as mypy, and each default-branch run captures version, runtime,
peak memory and normalised diagnostics, diffs them against mypy by stable
location and code, and uploads a JSON artifact retained for the evaluation
window. A shadow tool failure is visible as shadow infrastructure failure
without blocking the gate. Promotion is decided on measured criteria — crash
rate, runtime and memory, false-positive adjudications, false negatives found,
unsupported features — not on a stability label.

## Division of responsibility

`baseline-py check` implements **only** what nothing else covers:

| Concern                        | Owner                                       |
| ------------------------------ | ------------------------------------------- |
| Lint, format, import order     | ruff                                        |
| Complexity, docstring coverage | ruff (`C901`, `PLR0912`, `PLR0915`, `D1xx`) |
| Security patterns              | ruff (curated `S` subset)                   |
| Types                          | mypy strict (pyrefly shadow)                |
| Dependency hygiene             | deptry                                      |
| Known advisories               | pip-audit (locked project)                  |
| Tests and coverage             | pytest + pytest-cov                         |
| Reproducibility                | uv (`uv lock --check`, `uv sync --locked`)  |
| Structural house rules         | `baseline-py check`                         |

Excluded from v1: `radon` / `xenon` (covered by ruff), `interrogate` (covered by
ruff `D1xx`), `import-linter` (only where real layers exist), a plugin framework
inside `baseline-py`, and — cut on review — **the custom tips subsystem**
(`broad-except`, `print-over-logging`, `untyped-dict-payload`). Tips would add a
second severity and suppression taxonomy before the blocking rules, roles,
baselines and diagnostic schema are proven; two of the three overlap ruff, and
the third needs type-aware context to avoid noise. The design space is reserved,
nothing ships until the estate pass validates the blocking contracts.

`vulture` (dead code) and `jscpd` (duplication) are worth having but start
**advisory**: vulture's false positives on decorators, registries and framework
entrypoints are expensive, and jscpd's Python noise must be calibrated against
the five real repositories before it can block.

## Template

One new template: `templates/python-package` — `src/` layout, uv with a
committed `uv.lock`, `pyproject.toml` with hatchling, the full scaffolded asset
set, a passing example module and test, and the CI workflow. It covers the shape
the estate actually has. A `fastapi-app` template is not built until a real HTTP
service exists in `~/p` to consume it.

## Rollout and verification

Each stage's success criterion is a command that must pass.

1. **Rules and engine**, dogfooded on the package's own source — verify:
   `uv run --project packages/baseline-py baseline-py check packages/baseline-py/src`
   exits 0. The bootstrap runs through `uv run`, since the entry point does not
   exist before installation.
2. **Contracts frozen** — config schema, `BPY` codes, JSON document, exit codes,
   fingerprints — verify: schema fixtures and golden-output tests pass. This
   precedes any estate baseline; a baseline written against a wrong checker
   becomes a second estate-wide migration.
3. **`init`** — verify: `init --check` against real copies of `atrium`,
   `memstore` and `consumer-b` reports `merge`, never `create`, for ruff
   configuration, and reports memstore's existing mypy and pytest-cov as
   already present.
4. **Estate pass, read-only first** — `check --format json` over `atrium`,
   `memstore`, `consumer-b`, `multi-project-repo/consumer-w` and
   `multi-project-repo/consumer-c`, producing a findings report per repo and no
   repository change whatsoever. Adoption — config, lock and baseline — is a
   separate, individually reviewed change per repo. Expected scale, from the
   review's inventory: memstore ~61 multi-unit modules, consumer-b ~23
   filename mismatches, the two firmware hosts ~19–20 multi-unit modules each.
5. **Template** — verify: render into a temporary directory, lock and sync from
   scratch, run the installed `gate`, build sdist and wheel, install the wheel
   into a clean environment and import the package. Checking the template source
   in place would miss invalid generated TOML, missing package data and broken
   entry points.
6. **Publish** — verify: `gh workflow run publish-python.yml`, then the package
   installs from PyPI into a clean environment and `baseline-py --version`
   reports the released version.

## Open questions

None blocking. Two to revisit after the estate pass: the default
`max-file-lines` (150 matches Rust, but Python's density differs — the estate
pass gives the real distribution), and whether `vulture` and `jscpd` graduate
from advisory to blocking.
