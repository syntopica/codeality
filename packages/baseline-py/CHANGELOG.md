# Changelog

All notable changes to `busirocket-baseline-py` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.8

### Added

- `init` now reports a `ruff.toml` sitting beside a pyproject that also declares
  `[tool.ruff]`. Ruff reads one configuration per directory, so the file wins
  outright and the table is never read - silently. The pair builds itself over
  time: init writes the file when no table exists, and a table arrives later.
  Found in consumer-a, which spent a release linting against a config nobody
  read; once the shadow was removed, 1707 findings resolved to 6 real ones.

### Changed

- The shipped deptry ignores gained `DEP004` defaults for the pytest family:
  test tooling legitimately lives in a dev group and is imported only by tests.

## 0.1.7

### Changed

- A missing shadow-stage tool is now `skipped-not-applicable` instead of
  `failed-to-run`. A required tool that cannot run is still a failure; an
  advisory tool that was never installed is not an alarm.
- `init` no longer adds the quality dependency group to a project whose
  `requires-python` floor is below 3.11: the group carries
  `busirocket-baseline-py`, and declaring it there makes every uv resolution
  unsatisfiable. Found adopting the baseline in `consumer-b`, which declares
  `>=3.8` for its Raspberry Pi target.

## 0.1.6

### Added

- `[audit] ignore-vulns` in `baseline-py.toml`: accepted advisories, each
  expected to carry a written reason, reach pip-audit as `--ignore-vuln` flags.
  Found adopting the baseline in `consumer-c`, where platformio 6.x pins
  starlette below the patched release and the gate had no way to accept the
  documented risk.
- `init` records the discovered `import-package`, so coverage measures the
  package instead of a source directory path.

### Changed

- Tests' per-file-ignores grew `S105`, `S106`, `S108` (fixtures hold dummy
  tokens and /tmp sockets) and now ignore the whole `PLR` family (a test factory
  with seven keywords is a fixture, not a design smell).

## 0.1.5

### Changed

- Root discovery now reads the layout a `pyproject.toml` already declares -
  pytest's `pythonpath` and `testpaths`, hatch's wheel `packages` - before
  guessing from directories. Found adopting the baseline in `consumer-c`, a
  firmware host whose Python lives under `host/src` where directory scanning
  sees nothing.
- The test per-file-ignores pattern is `**/tests/**`, so it also reaches nested
  test roots such as `host/tests`.
- `D107` joined the ignore list: an `__init__` that stores its arguments has
  nothing to add to the class docstring.

### Fixed

- The package now passes its own `init`-scaffolded configuration - it had been
  gating itself with ruff's and mypy's defaults instead of the strict config it
  ships, because no `ruff.toml` or `mypy.ini` existed in the repository.

## 0.1.4

### Fixed

- The gate's structural stage now honors a recorded baseline: when
  `.baseline-py-baseline.json` exists it runs `baseline-py baseline check`
  instead of the bare `check`, so recording debt can actually turn the gate
  green. Found adopting the baseline in `atrium`, where 61 recorded findings
  still failed the gate.
- Merging into an existing `[tool.ruff]` no longer drops the per-file test
  ignores and the pydocstyle convention the standalone `ruff.toml` always
  carried. A project that already had a ruff table was held to docstring rules
  in its tests that a fresh project was not.
- The shipped `baseline-py.toml` now carries `coverage-threshold = 80`, which
  the dogfooded config always had and the asset silently lacked.

## 0.1.3

### Changed

- Python 3.11 is now supported. `ast.TypeAlias` handling degrades gracefully: on
  3.11 the PEP 695 syntax cannot parse at all, so nothing is lost. Found
  adopting the baseline in `atrium`, whose `requires-python = ">=3.11"` made the
  quality group unresolvable.
- `init` now discovers what it used to ask for: `source-roots` in
  `baseline-py.toml`, `known_first_party` for deptry, and the import-linter root
  package are filled from the project's real layout instead of `src` and
  `CHANGE_ME` placeholders. The placeholder survives only when nothing is
  discoverable.

## 0.1.2

### Fixed

- Baseline fingerprints no longer collapse several violations of one rule in one
  file into a single entry, which let a fixed finding pay for a new one.
  Identity is now decided per rule: a file-level rule (`BPY001`, `BPY004`)
  identifies itself, a naming rule (`BPY002`, `BPY003`) identifies its symbol,
  and everything else uses the offending line's content plus an occurrence
  counter, so it survives edits elsewhere in the file. Found adopting the
  baseline in consumer-a, where 155 findings recorded as only 91 entries.

## 0.1.1

### Fixed

- Glob patterns now mean what they do everywhere else: `*` stops at a directory
  separator and `**` crosses it. They were matched with `fnmatch`, whose `*`
  crosses separators, so a role or override written for the scripts in a
  repository root silently claimed every file in the tree. Found while adopting
  the baseline in consumer-a, where `entrypoint = ["*.py"]` matched all 106
  files instead of the 40 at the root and hid 25 real `BPY002` findings.

## 0.1.0

Initial release.

### Added

- `baseline-py check`: six structural rules no ruff rule covers, over module
  roles assigned before any file is parsed.
  - `BPY000` parse-error, `BPY001` one-primary-unit, `BPY002` file-matches-unit,
    `BPY003` no-grab-bag-names, `BPY004` max-file-lines, `BPY005`
    barrel-only-init, `BPY006` no-inline-sql.
  - Text and versioned JSON output, four exit codes, inline and configured
    suppressions. The command never writes.
- `baseline-py init`: scaffolds ruff, mypy, deptry, pytest, coverage and CI
  configuration by merging into what a project already has. A project that
  configures ruff gets its `[tool.ruff]` extended, never a `ruff.toml` that
  would silently take precedence over it.
- `baseline-py gate`: runs the whole quality chain. A required tool that is not
  installed fails the gate rather than being skipped.
- `baseline-py baseline update|check`: records migration debt by content
  fingerprint, reports new, known and resolved findings.
