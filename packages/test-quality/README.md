# @syntopica/test-quality

Test-suite cost audit for vitest projects: finds where a suite spends its time
and memory on work that is not testing. Each finding is a measurement or a
reading of the project's own config, with the evidence that makes it checkable.

Every finding is an error and fails the command; there is no warning level. What
asks for no change (timings, memory, what a hook runs) is printed as an
observation beside the findings and never fails anything.

Built from one suite's diagnosis (verticagtm, 2026-10-04): building a jsdom
window per file was 61-72% of the work while two thirds of the files never
touched it, a `projects` split ran every file twice without failing, and the
pre-push hook ran ESLint and Prettier cold. Fixing those took the suite from
106-131 s to 72 s and the pre-push hook from 417-547 s to 228 s.

## Install

```bash
pnpm add -D @syntopica/test-quality
```

`vitest` (3 or later) must be installed in the audited project; the tool loads
it from there.

## Usage

```bash
codeality-test check [--json]
codeality-test measure [--json] [--node-candidates] [--top <n>] [-- <vitest args>]
```

`--project <dir>` before the command runs against another directory.

For a slow Vitest suite, run the installed Vitest's `doctor` command on a
representative subset after `codeality-test check`, if that Vitest version
supports it:

```bash
pnpm exec vitest doctor path/to/tests
```

`doctor` runs the tests repeatedly to compare worker pools, isolation and worker
counts, so keep it out of the normal CI gate. Record the host load and both
passing and failing candidates. Verify a proposed configuration on the full
suite with its coverage thresholds before adopting it; a subset that passes
without isolation cannot prove that unrelated tests do not leak state. For
Vitest 5, also inspect tests that change `process.env`: an open
[isolation issue](https://github.com/vitest-dev/vitest/issues/11423) reports
`test.env` values leaking between files with `isolate: false`.

`check` executes nothing. It asks the project's vitest which files it runs, in
which project and environment, and reads `package.json` with `lefthook.yml` or
`.husky/`:

| finding              | meaning                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `duplicate-file-run` | a file two projects both run; with `extends: true` a project's `include` is added to the root's |
| `uncached-hook-lint` | ESLint or Prettier reached from a git hook without `--cache`                                    |

| observation                  | meaning                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| `dom-environment-candidates` | files under jsdom/happy-dom whose source names no DOM API: guesses for node |
| `hook-runs-full-gate`        | a hook reaches the static gate and the whole suite                          |

`measure` runs the suite once, with vitest's JSON reporter beside the default
one, sampling the resident memory of vitest and every worker once a second:

| finding                  | meaning                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `environment-dominates`  | environment setup is over 40% of the work and outweighs the tests         |
| `dom-environment-unused` | with `--node-candidates`: candidates that pass under `--environment node` |

| observation     | meaning                                    |
| --------------- | ------------------------------------------ |
| `suite-run`     | vitest's exit code and the run's wall time |
| `slowest-files` | the `--top` slowest files (default 10)     |
| `memory-use`    | peak and mean RSS of the run               |

The candidate list is deliberately broad on the DOM side: a file that names
`window`, `render`, `@testing-library/...` and the like is never proposed, and
the node rerun decides for the rest. Move the files that pass to a node project
and give the few that need a window a `// @vitest-environment jsdom` docblock.

Hosted CI is not flagged for running ESLint cold: a cache can hold typed-rule
results that a change elsewhere made stale, so a cold run there is the backstop
for the cached local gate.

## Exit codes

`0` no findings, `1` findings (observations never count), `2` invalid usage or
configuration (including a project vitest cannot list), `3` anything else.

## JSON

`--json` prints
`{ "schemaVersion": 2, "findings": [...], "observations": [...] }`. A finding is
`{ rule, severity: "error", message, evidence }`; an observation is
`{ name, message, evidence }` and has no severity.
