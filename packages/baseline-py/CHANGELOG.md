# Changelog

All notable changes to `busirocket-baseline-py` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
