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
