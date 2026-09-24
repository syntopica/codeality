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
   fail without the lock. Better still, when the resource can be copied, stop
   sharing it: a database schema per worker (below) removes the lock and the
   wait together.
7. **Shorten waits on measurement, never on hope.** A "settle" timeout stays
   until nine launches say where the last line lands: in one case every
   complaint arrived within 20 ms of the load marker and the log stopped 0.2 s
   after it, so a 2 s wait became 1 s with a fivefold margin.

### Vitest suites against a real database

Measured on a Next.js + MySQL monorepo on 2026-09-24: the full check went from
819 s for the core suite alone to 139 s for everything. The runs alternated A
and B three times and the best of each counts, because the machine sat at load
25-60. The same config gave 88 s and 115 s an hour apart, so a single run proves
nothing. In order of gain:

| Change                                                                                                                                                       | Before              | After                      | Verdict                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| Clean only the tables a test dirtied, instead of `TRUNCATE` of all 89 before every test                                                                      | 819 s               | 380 s                      | keep                                                                                  |
| Split DB-free files into their own parallel project; only DB files stay serial                                                                               | 380 s               | 138 s                      | keep                                                                                  |
| Test MySQL on tmpfs with durability off (Docker, `--skip-log-bin`, `innodb_flush_log_at_trx_commit=0`, `innodb_doublewrite=0`, `innodb_flush_method=nosync`) | core 67 s, db 20 s  | 26 s, 7 s                  | keep                                                                                  |
| A schema per worker (clone of the run's migrated schema, keyed on `VITEST_POOL_ID`), so DB files run in parallel                                             | core 126 s          | 103 s                      | keep where DB files are many (73); in an 8-file package cloning cost more than it won |
| Web: split `.test.ts` files that never touch the DOM into an `environment: 'node'` project                                                                   | 88 s                | 67 s                       | keep                                                                                  |
| Web: `happy-dom` instead of `jsdom` for the rest                                                                                                             | 59 s                | 51 s                       | keep (all tests passed unchanged)                                                     |
| `fsModuleCache: true` + `NODE_COMPILE_CACHE`                                                                                                                 | web 55 s, core 87 s | 45 s at best, core no gain | noise-level; not adopted                                                              |
| `isolate: false` (globally or on the node project only)                                                                                                      | web 60 s            | 26-60 s                    | rejected: 2-22 tests fail on leaked module state                                      |
| `DELETE` + `ALTER ... AUTO_INCREMENT` instead of `TRUNCATE`                                                                                                  | 32-49 s             | 49-59 s                    | rejected                                                                              |

Rules that fall out of it:

- **Point the tests at a throwaway server.** A developer's MySQL is durable and
  flushes on every commit, and a test suite is mostly commits. Run the test
  database in a container with its data on tmpfs, and never tune the durable
  server down instead: it may hold data you need to keep. The suite should probe
  for the fast server and fall back to the normal one, rather than read an env
  var. turbo's strict env mode strips undeclared variables, so an env switch
  silently does nothing under `turbo run test`.
- **Clean up by what the test touched.** One `UNION ALL` of
  `EXISTS (SELECT 1 FROM t)` per table, plus `information_schema.tables`
  `auto_increment > 1` read with `information_schema_stats_expiry = 0`, lists
  the dirty tables in one round trip. Do the cleanup on one pinned connection:
  `SET FOREIGN_KEY_CHECKS = 0` on a pool applies to whichever connection it
  happened to land on.
- **Find DB tests by what they import, not by a list.** The config globs the
  test files and reads each one; any file that imports the test-db helpers lands
  in the database project. A new test cannot be forgotten.
- **Clone a schema with `SHOW CREATE TABLE`, not `CREATE TABLE ... LIKE`.**
  `LIKE` drops foreign keys, so cascade tests pass against the clone for the
  wrong reason. Turn FK checks off while creating, copy the migrations log, and
  name the clone after the run's schema so the stale-schema sweep and the run's
  teardown both find it.
- **Per-test transaction rollback does not fit code that opens its own
  transactions.** MySQL has no nested `BEGIN`: an inner `BEGIN` implicitly
  commits the outer one. Code under test with dozens of `.transaction(` call
  sites therefore escapes the rollback. Clean up by table instead.

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
