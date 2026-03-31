# Testing Standard

## Default: Vitest

Vitest is the default test runner for all new projects: TS packages, Vite apps, Astro sites, and Next.js apps.

Use Jest only when:
- The project targets a vendor SDK or third-party ecosystem that explicitly requires Jest (e.g. Client widgets widgets)
- The migration cost from existing Jest tests is not justified

When in doubt, choose Vitest.

## Config convention

Vitest config lives in `vitest.config.ts`, separate from `vite.config.ts`. Do not merge them.

### Frontend / browser projects

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

### Node / tooling packages

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
  },
})
```

## E2E: Playwright

Playwright is the optional E2E layer. It is not required by default. Add it when the project explicitly requires browser-level integration tests.

Do not use Playwright for unit tests or component tests — that is Vitest's domain.

## Mandatory scripts

```jsonc
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`test` (single run) must be included in `check:ci`.
