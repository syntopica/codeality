# @syntopica/test-quality

Test-suite cost audit for vitest projects: finds where a suite spends its time
and memory on work that is not testing. Each finding is a measurement or a
reading of the project's own config, with the evidence that makes it checkable.

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

`check` executes nothing. It asks the project's vitest which files it runs, in
which project and environment, and reads `package.json` with `lefthook.yml` or
`.husky/`:

| rule                     | severity | meaning                                                                                         |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `duplicate-file-run`     | warning  | a file two projects both run; with `extends: true` a project's `include` is added to the root's |
| `dom-environment-unused` | warning  | a file under jsdom/happy-dom whose source names no DOM API: a candidate for node                |
| `uncached-hook-lint`     | warning  | ESLint or Prettier reached from a git hook without `--cache`                                    |
| `hook-runs-full-gate`    | info     | a hook reaches the static gate and the whole suite                                              |

`measure` runs the suite once, with vitest's JSON reporter beside the default
one, sampling the resident memory of vitest and every worker once a second:

| rule                     | severity | meaning                                                                   |
| ------------------------ | -------- | ------------------------------------------------------------------------- |
| `environment-dominates`  | warning  | environment setup is over 40% of the work and outweighs the tests         |
| `slowest-files`          | info     | the `--top` slowest files (default 10)                                    |
| `memory-use`             | info     | peak and mean RSS of the run                                              |
| `dom-environment-unused` | warning  | with `--node-candidates`: candidates that pass under `--environment node` |

The candidate list is deliberately broad on the DOM side: a file that names
`window`, `render`, `@testing-library/...` and the like is never proposed, and
the node rerun decides for the rest. Move the files that pass to a node project
and give the few that need a window a `// @vitest-environment jsdom` docblock.

Hosted CI is not flagged for running ESLint cold: a cache can hold typed-rule
results that a change elsewhere made stale, so a cold run there is the backstop
for the cached local gate.

## Exit codes

`0` no warnings, `1` warnings, `2` invalid usage or configuration (including a
project vitest cannot list), `3` anything else.
