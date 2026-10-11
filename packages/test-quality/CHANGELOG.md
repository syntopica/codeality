# Changelog

## [Unreleased]

- **Breaking:** the warning and info severities are gone. Every finding is an
  `error` and fails the command: `duplicate-file-run`, `dom-environment-unused`,
  `uncached-hook-lint` and `environment-dominates`, which warned before, now say
  so. The readings that asked for no change (`suite-run`, `slowest-files`,
  `memory-use`, `hook-runs-full-gate`), which were `info` findings, are now
  observations: printed first in the text output without a severity, and under a
  new `observations` key in `--json`, as `{ name, message, evidence }`. The JSON
  output moves to `schemaVersion: 2`. Exit codes do not change: a warning failed
  the command before and an info did not, which is what a finding and an
  observation do now.

## 0.1.2

- `duplicate-file-run` lists each file's projects in sorted order. Vitest
  reports projects in the order they finish collecting, so the evidence changed
  between runs and a baseline keyed on it could not match.

## 0.1.1

- `dom-environment-unused` counts a file once even when several projects run it:
  a doubled config reported "1034 of 1559 files" for a 1545-file suite.

## 0.1.0

- First release. `codeality-test check` reads the suite through the project's
  own vitest config without running it and the git hooks: files that run in more
  than one project (`duplicate-file-run`), files under jsdom/happy-dom that name
  no DOM API (`dom-environment-unused`), lint and format steps a hook reaches
  without a cache (`uncached-hook-lint`), and a hook that runs the static gate
  and the whole suite (`hook-runs-full-gate`, info).
- `codeality-test measure` runs the suite once with a JSON report and samples
  the memory of vitest and its workers: environment setup against test time
  (`environment-dominates`, vitest 4 seconds and vitest 5 shares), slowest
  files, peak and mean RSS. `--node-candidates` reruns the DOM-free candidates
  under `--environment node` and reports the ones that pass.
