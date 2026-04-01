# Testing Standard

## Default: Vitest

Vitest is the default test runner for all new projects: TS packages, Vite apps, Astro sites, and Next.js apps.

Use Jest only when:

- The project targets a vendor SDK or third-party ecosystem that explicitly requires Jest
- The migration cost from existing Jest tests is not justified

When in doubt, choose Vitest.

## Config convention

Vitest config lives in `vitest.config.ts`. Do not merge it into `vite.config.ts`.
Every template in this repo ships at least one smoke test so `test` and `check:ci` exercise real code.

### Vite + React (jsdom)

Include the Vite React plugin so JSX transform works inside Vitest:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

### React component rendering tests

To render and assert on React components, install `@testing-library/react` and add a setup file:

```ts
// src/test/setup.ts
import "@testing-library/react";
```

```ts
// vitest.config.ts — add setupFiles
test: {
  setupFiles: ['./src/test/setup.ts'],
}
```

The template smoke tests deliberately avoid `@testing-library/react` to keep the baseline dependency-light. Add it in your project once you have real components to test.

### Next.js (jsdom or node depending on what you test)

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

### Astro / Node / tooling packages

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
  },
});
```

## E2E: Playwright

Playwright is the optional E2E layer. Add it when the project explicitly requires browser-level integration tests. Do not use it for unit or component tests.

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
