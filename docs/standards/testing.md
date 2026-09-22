# Testing Standard

## Default: Vitest

Vitest is the default test runner for all new projects: TS packages, Vite apps,
Astro sites, and Next.js apps.

Use Jest only when:

- The project targets a vendor SDK or third-party ecosystem that explicitly
  requires Jest
- The migration cost from existing Jest tests is not justified

When in doubt, choose Vitest.

## Config convention

Vitest config lives in `vitest.config.ts`. Do not merge it into
`vite.config.ts`. Every template in this repo ships at least one smoke test so
`test` and `check:ci` exercise real code.

### Vite + React (jsdom)

Include the Vite React plugin so JSX transform works inside Vitest:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

### React component rendering tests

To render and assert on React components, install `@testing-library/react` and
add a setup file:

```ts
// src/test/setup.ts
import '@testing-library/react'
```

```ts
// vitest.config.ts — add setupFiles
test: {
  setupFiles: ['./src/test/setup.ts'],
}
```

The template smoke tests deliberately avoid `@testing-library/react` to keep the
baseline dependency-light. Add it in your project once you have real components
to test.

### Next.js (jsdom or node depending on what you test)

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

### Astro / Node / tooling packages

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
  },
})
```

## Test file discipline

Test files are held to a policy of their own, not exempted from policy. The
overrides live in `code-quality.ts` in eslint-config and apply to
`*.{test,spec}.{ts,tsx}`, `__tests__/`, `tests/` and `test/`.

| Rule                                           | Test files       | Production   | Why the difference                                                                                                                                                                    |
| ---------------------------------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `max-lines`                                    | **error at 200** | error at 100 | A test file carries arrange scaffolding its subject does not. Past 200 lines it is covering more than one behaviour.                                                                  |
| `max-lines-per-function`                       | off              | warn at 50   | In a test file the longest function is the top-level `describe` callback, so the rule measures the wrapper, not complexity. Twenty trivial `it` cases already report a 62-line arrow. |
| `code-policy/file-kind-placement`              | error            | error        | Costs no extra code and is what keeps a shared fixture findable.                                                                                                                      |
| `code-policy/one-primary-unit`                 | off              | error        | A suite is not an exported unit.                                                                                                                                                      |
| `code-policy/no-hidden-top-level-declarations` | off              | error        | Local builders and fixtures belong next to the cases that use them.                                                                                                                   |
| `code-policy/no-inline-types-in-runtime-files` | off              | error        | Inline fixture types are idiomatic in tests.                                                                                                                                          |

The three rules that stay off are the ones that would mean writing twice the
code for the same tests: each would force a local builder to be exported or
extracted. The two that stay on are the ones that cost nothing to satisfy.

### Splitting past the budget

Split by behaviour, not by line count. One file per behaviour under test is also
what makes a failure easy to locate: the failing file names the thing that
broke. When several suites need the same fixture, extract it to a semantically
named folder - `fixtures/`, `builders/`, `rule-testers/` - never `utils/` or
`helpers/`, which `file-kind-placement` rejects.

### Fixtures are not linted

`tests/fixtures/**` and `__fixtures__/**` are in the shared ESLint ignore list.
A rule that reads the filesystem needs deliberately malformed sample files on
disk, and linting them reports the very violations they exist to reproduce.

### Duplication

`jscpd` scans test files on purpose (`minTokens: 70`, 1% threshold). Copy-pasted
test scaffolding is duplication that has to be maintained like any other, so it
is gated the same way. See `docs/standards/quality-gates.md`.

## Suite time budget

A suite has a time budget, and going over it is a finding, not a fact of life.
The gate is what says the number is too big: `codeality-py gate` reports the
pytest stage as `over-budget` past `test-budget-seconds` (scaffolded at 300); a
Vitest project puts the same number in `check:ci`'s timeout. Where this comes
from: a Python suite in this estate grew to 31 minutes with every gate green,
and one profiling pass took it to four minutes, a second to two, and parallel
workers to 32 seconds (2026-09-22). Nothing about it needed hardware.

Work in this order. Each step is measured before the next starts.

1. **Find where the time goes.** pytest: `--durations=25` (the gate passes
   `--durations=10` on every run), then sum per file. Vitest:
   `vitest run --reporter=verbose` prints each test's time and flags those over
   `slowTestThreshold`. Read the result with the machine's load beside it: the
   same suite measured 240 s and 331 s within an hour on a shared box.
2. **Profile one slow test, not the suite.** `python -m cProfile -s tottime` or
   `node --cpu-prof` on a single test that takes seconds. The usual finding is a
   cache created per call instead of per immutable input: a helper that parsed
   the same file 620 951 times in one run because each caller built a fresh
   evaluator. Memoise on the immutable input - the parsed document, the graph -
   and hand out copies where a caller may write.
3. **Do the walk in the runtime, not in the language.** lxml's `{*}name`
   wildcard walks a namespaced tree in C where a Python filter on the local name
   cost 2.7 million calls per run; `Array.prototype` and native `querySelector`
   do the same for TypeScript. One pass went from 2.4 s to 0.8 s on this step
   and memoisation alone.
4. **Prove the outputs did not change.** Dump the unit's result for every real
   input before the change and diff it after; a speed-up that changes one
   finding is a bug with a good excuse. Identical means byte-identical.
5. **Then parallelise.** pytest: `pytest-xdist`, `-n auto` in `addopts`, `-n 0`
   for a debugger. Vitest runs files in parallel already; `pool` and
   `maxWorkers` are the dials. Parallel is the last step, not the first: it
   hides the problem it multiplies.
6. **Serialise what must stay shared, in the code that uses it.** A GUI process,
   a hard-coded log file, a port, a database: the code that opens it takes a
   lock (`fcntl.flock` on a file in the user's tempdir; `proper-lockfile` in
   Node), so every caller is serialised without the tests knowing. Never by test
   ordering or worker groups: the next test that touches the resource will not
   be marked. Write the regression as two calls from two threads and watch it
   fail without the lock.
7. **Shorten waits on measurement, never on hope.** A "settle" timeout stays
   until nine launches say where the last line lands: in one case every
   complaint arrived within 20 ms of the load marker and the log stopped 0.2 s
   after it, so a 2 s wait became 1 s with a fivefold margin.

What goes in the report: the durations table, the profile's top entries, the
identical-output diff, the timing under load. "It is faster" is not a report.

## Runtime accessibility tests

For React-based projects, add a smoke-level accessibility test using
`@testing-library/react` + `vitest-axe`. This is now part of the baseline
templates for Next.js and Vite React.

Astro keeps lint-first accessibility by default; add browser-level checks when
the site has richer interactivity.

## E2E: Playwright

Playwright is the optional E2E layer. Add it when the project explicitly
requires browser-level integration tests. Do not use it for unit or component
tests.

## Mandatory scripts

```jsonc
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
  },
}
```

`test` (single run) must be included in `check:ci`.
