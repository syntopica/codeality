# Changelog

All notable changes to `busirocket-baseline-py` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
