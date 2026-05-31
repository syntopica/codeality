# Paranoid Vue 3 SPA Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `templates/vue-app` Vue 3 SPA starter to the `baseline` monorepo
that mirrors `vite-react-app`, consumes the shared `@busirocket/*` configs, and
demonstrates paranoid 2026 practices (Zod-validated env, `vue-tsc` template
type-checking, architecture boundaries, supply-chain + coverage hardening).

**Architecture:** A Vite SPA whose ESLint layers are
`base → vite-vue → code-quality → tailwind`. Vue-specific accessibility lint
lives inside the new `vite-vue` layer (jsx-a11y does not apply to SFCs).
Type-checking uses `vue-tsc`. Two shared packages gain Vue exports
(`@busirocket/tsconfig/vite-vue.json`, `@busirocket/eslint-config/vite-vue`) and
`frontend-boundaries` gains a `composables` element.

**Tech Stack:** Vue 3.5, Vite 8, vue-router 5, Pinia 3, Zod 4, Tailwind v4,
Vitest 4 + @vue/test-utils + vitest-axe, vue-tsc 3, eslint-plugin-vue 10 +
eslint-plugin-vuejs-accessibility 2 + vue-eslint-parser 10, Lighthouse CI.

Work happens on branch `feat/vue-app-template` (already created).

---

## Pinned versions (verified on npm, 2026-05-30)

| Package                             | Range                                                        |
| ----------------------------------- | ------------------------------------------------------------ |
| `vue`                               | `^3.5.35`                                                    |
| `vue-router`                        | `^5.1.0`                                                     |
| `pinia`                             | `^3.0.4`                                                     |
| `@pinia/colada`                     | `^0.21.2` (peer of vue-router 5; pinned for reproducibility) |
| `zod`                               | `^4.4.3`                                                     |
| `@vitejs/plugin-vue`                | `^6.0.7`                                                     |
| `vue-tsc`                           | `^3.3.3`                                                     |
| `eslint-plugin-vue`                 | `^10.9.1`                                                    |
| `eslint-plugin-vuejs-accessibility` | `^2.5.0`                                                     |
| `vue-eslint-parser`                 | `^10.4.0`                                                    |
| `@vue/test-utils`                   | `^2.4.10`                                                    |
| `@vitest/coverage-v8`               | `^4.1.7`                                                     |

All other ranges copy `templates/vite-react-app/package.json` verbatim
(`vite ^8.0.14`, `vitest ^4.1.7`, `eslint ^10.4.1`, `typescript ^6.0.3`,
`typescript-eslint ^8.60.0`, `tailwindcss ^4.3.0`, `@tailwindcss/vite ^4.3.0`,
`vitest-axe ^0.1.0`, `jsdom ^29.1.1`, `@lhci/cli ^0.15.1`,
`@testing-library/jest-dom ^6.9.1`, `eslint-config-prettier ^10.1.8`,
`eslint-import-resolver-typescript ^4.4.4`, `eslint-plugin-import ^2.32.0`,
`eslint-plugin-promise ^7.3.0`, `eslint-plugin-security ^4.0.0`,
`eslint-plugin-sonarjs ^4.0.3`, `eslint-plugin-tailwindcss 4.0.0-beta.0`,
`eslint-plugin-unused-imports ^4.4.1`, `eslint-plugin-boundaries ^6.0.2`,
`@eslint/js ^10.0.1`, `jiti ^2.7.0`, `prettier ^3.8.3`,
`prettier-plugin-css-order ^2.2.0`, `prettier-plugin-organize-imports ^4.3.0`,
`prettier-plugin-tailwindcss ^0.8.0`).

---

## File structure

**Shared packages (modify):**

- `packages/tsconfig/vite-vue.json` (create) + `packages/tsconfig/package.json`
  (add export)
- `packages/eslint-config/src/vite-vue.ts` (create) +
  `packages/eslint-config/package.json` (add export + deps)
- `packages/eslint-config/src/frontend-boundaries.ts` (modify: add
  `composables`)
- `README.md`, `templates/README.md` (modify: mention Vue)

**Template (create `templates/vue-app/`):**

- Config: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`,
  `eslint.config.ts`, `prettier.config.mjs`, `.editorconfig`, `.npmrc`,
  `.lighthouserc.json`, `index.html`
- `public/robots.txt`
- `src/main.ts`, `src/App.vue`, `src/styles.css`, `src/vite-env.d.ts`,
  `src/env.ts`
- `src/router/index.ts`
- `src/stores/counter.ts`
- `src/composables/useCounter.ts`
- `src/services/fetchGreeting.ts`, `src/types/Greeting.ts`
- `src/lib/add.ts`
- `src/components/TheCounter.vue`, `src/components/TheCounter.test.ts`
- `src/lib/add.test.ts`, `src/env.test.ts`, `src/services/fetchGreeting.test.ts`
- `src/test/setup.ts`

---

## Task 1: Add `vite-vue` tsconfig export

**Files:**

- Create: `packages/tsconfig/vite-vue.json`
- Modify: `packages/tsconfig/package.json`

- [ ] **Step 1: Create the tsconfig**

`packages/tsconfig/vite-vue.json`:

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "_comment": "Vite + Vue app — extends app, checked/compiled by vue-tsc.",
  "extends": "./app.json",
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"],
}
```

- [ ] **Step 2: Add the export**

In `packages/tsconfig/package.json`, add to the `exports` object (after the
`./vite-react.json` line):

```json
    "./vite-vue.json": "./vite-vue.json",
```

- [ ] **Step 3: Verify it resolves**

Run:
`node -e "require.resolve('@busirocket/tsconfig/vite-vue.json', { paths: ['packages/tsconfig'] })"`
from repo root. Expected: prints the resolved path, no error. (If using pnpm
workspace resolution instead, this step is validated again in Task 13 by the
template build.)

- [ ] **Step 4: Commit**

```bash
git add packages/tsconfig/vite-vue.json packages/tsconfig/package.json
git commit -m "feat(tsconfig): add vite-vue config"
```

---

## Task 2: Add `composables` to frontend boundaries

**Files:**

- Modify: `packages/eslint-config/src/frontend-boundaries.ts`

- [ ] **Step 1: Add the `composables` shared-layer entries**

In `packages/eslint-config/src/frontend-boundaries.ts`, inside the
`boundaries/elements` array, immediately after the four `hooks` entries (the
block ending with `{ type: 'shared', pattern: 'src/hooks/**/*' },`), insert:

```ts
        { type: 'shared', pattern: 'composables/*' },
        { type: 'shared', pattern: 'composables/**/*' },
        { type: 'shared', pattern: 'src/composables/*' },
        { type: 'shared', pattern: 'src/composables/**/*' },
```

- [ ] **Step 2: Update the JSDoc**

In the same file, change the header comment's first line from:

```ts
 * Layered import boundaries for frontend apps (Next.js App Router, Vite React,
 * Astro with React islands).
```

to:

```ts
 * Layered import boundaries for frontend apps (Next.js App Router, Vite React,
 * Vite Vue, Astro with React islands).
```

And change the `hooks` bullet:

```ts
 * - `hooks`, `types`, `utils`, `const`, `lib`, `store` are shared ownership layers.
```

to:

```ts
 * - `hooks`, `composables`, `types`, `utils`, `const`, `lib`, `store` are shared ownership layers.
```

- [ ] **Step 3: Verify the config package still type-checks**

Run: `pnpm --filter @busirocket/eslint-config type-check` Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add packages/eslint-config/src/frontend-boundaries.ts
git commit -m "feat(eslint-config): add composables to frontend boundaries"
```

---

## Task 3: Create the `vite-vue` ESLint layer

**Files:**

- Create: `packages/eslint-config/src/vite-vue.ts`
- Modify: `packages/eslint-config/package.json`

- [ ] **Step 1: Create the config**

`packages/eslint-config/src/vite-vue.ts`:

```ts
import tseslint from 'typescript-eslint'

import { createFrontendBoundariesConfig } from './frontend-boundaries'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pluginVue = require('eslint-plugin-vue') as {
  configs: Record<string, unknown[]>
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vueA11y = require('eslint-plugin-vuejs-accessibility') as {
  configs: Record<string, unknown[]>
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vueParser = require('vue-eslint-parser') as object

export type ViteVueConfigOptions = {
  tsconfigRootDir?: string
}

/**
 * Vue 3 SFC linting layer for Vite apps.
 *
 * - eslint-plugin-vue `flat/recommended` (highest priority tier: essential +
 *   strongly-recommended + recommended).
 * - eslint-plugin-vuejs-accessibility `flat/recommended` (jsx-a11y does not lint
 *   `.vue` SFCs, so Vue gets its own a11y layer here).
 * - `.vue` files parsed by vue-eslint-parser with typescript-eslint as the
 *   `<script lang="ts">` parser (type-aware via projectService).
 * - Reuses the shared frontend import boundaries.
 */
export const createViteVueConfig = (options: ViteVueConfigOptions = {}) => {
  const tsconfigRootDir = options.tsconfigRootDir ?? process.cwd()
  const vueRecommended = pluginVue.configs['flat/recommended'] ?? []
  const a11yRecommended = vueA11y.configs['flat/recommended'] ?? []

  return [
    ...vueRecommended,
    ...a11yRecommended,
    {
      files: ['**/*.vue'],
      languageOptions: {
        parser: vueParser,
        parserOptions: {
          parser: tseslint.parser,
          projectService: true,
          tsconfigRootDir,
          extraFileExtensions: ['.vue'],
          ecmaVersion: 2024,
          sourceType: 'module',
        },
      },
      rules: {
        // raw HTML binding is an XSS vector
        'vue/no-v-html': 'error',
        // force the type-based defineProps<...>() form
        'vue/define-props-declaration': ['error', 'type-based'],
        // refs must carry a type when it cannot be inferred
        'vue/require-typed-ref': 'error',
        // multi-word component names (root App is the conventional exception)
        'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
      },
    },
    ...createFrontendBoundariesConfig(),
  ]
}

export default createViteVueConfig
```

- [ ] **Step 2: Add the export and dependencies**

In `packages/eslint-config/package.json`:

1. Add to `exports` (after `./vite-react`):

```json
    "./vite-vue": "./src/vite-vue.ts",
```

2. Add to `peerDependencies`:

```json
    "eslint-plugin-vue": ">=10.0.0",
    "eslint-plugin-vuejs-accessibility": ">=2.4.0",
    "vue-eslint-parser": ">=10.0.0",
```

3. Add to `peerDependenciesMeta` (all optional, like the other framework
   plugins):

```json
    "eslint-plugin-vue": {
      "optional": true
    },
    "eslint-plugin-vuejs-accessibility": {
      "optional": true
    },
    "vue-eslint-parser": {
      "optional": true
    },
```

4. Add to `devDependencies` (so the package can type-check/lint its own source):

```json
    "eslint-plugin-vue": "^10.9.1",
    "eslint-plugin-vuejs-accessibility": "^2.5.0",
    "vue-eslint-parser": "^10.4.0",
```

- [ ] **Step 3: Install the new dev deps**

Run: `pnpm install` Expected: completes; `eslint-plugin-vue`,
`eslint-plugin-vuejs-accessibility`, `vue-eslint-parser` linked into
`packages/eslint-config`.

- [ ] **Step 4: Verify the config package type-checks and lints**

Run:
`pnpm --filter @busirocket/eslint-config type-check && pnpm --filter @busirocket/eslint-config lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-config/src/vite-vue.ts packages/eslint-config/package.json pnpm-lock.yaml
git commit -m "feat(eslint-config): add vite-vue layer with Vue + a11y rules"
```

---

## Task 4: Scaffold the template config files

**Files:**

- Create: `templates/vue-app/package.json`, `tsconfig.json`, `vite.config.ts`,
  `vitest.config.ts`, `prettier.config.mjs`, `.editorconfig`, `.npmrc`,
  `.lighthouserc.json`, `index.html`, `public/robots.txt`

- [ ] **Step 1: `templates/vue-app/package.json`**

```json
{
  "name": "my-vue-app",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.5.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "fix": "pnpm lint:fix && pnpm format",
    "format": "prettier --write . --list-different",
    "format:check": "prettier --check .",
    "type-check": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "check:all": "pnpm type-check && pnpm lint && pnpm format:check",
    "check:ci": "pnpm type-check && pnpm lint && pnpm format:check && pnpm test",
    "test:a11y": "vitest run",
    "perf:check": "pnpm build && lhci autorun --config=.lighthouserc.json"
  },
  "dependencies": {
    "@pinia/colada": "^0.21.2",
    "@tailwindcss/vite": "^4.3.0",
    "pinia": "^3.0.4",
    "vue": "^3.5.35",
    "vue-router": "^5.1.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@busirocket/eslint-config": "workspace:*",
    "@busirocket/prettier-config": "workspace:*",
    "@busirocket/tsconfig": "workspace:*",
    "@eslint/js": "^10.0.1",
    "@lhci/cli": "^0.15.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@vitejs/plugin-vue": "^6.0.7",
    "@vitest/coverage-v8": "^4.1.7",
    "@vue/test-utils": "^2.4.10",
    "eslint": "^10.4.1",
    "eslint-config-prettier": "^10.1.8",
    "eslint-import-resolver-typescript": "^4.4.4",
    "eslint-plugin-boundaries": "^6.0.2",
    "eslint-plugin-code-policy": "workspace:*",
    "eslint-plugin-import": "^2.32.0",
    "eslint-plugin-promise": "^7.3.0",
    "eslint-plugin-security": "^4.0.0",
    "eslint-plugin-sonarjs": "^4.0.3",
    "eslint-plugin-tailwindcss": "4.0.0-beta.0",
    "eslint-plugin-unused-imports": "^4.4.1",
    "eslint-plugin-vue": "^10.9.1",
    "eslint-plugin-vuejs-accessibility": "^2.5.0",
    "jiti": "^2.7.0",
    "jsdom": "^29.1.1",
    "prettier": "^3.8.3",
    "prettier-plugin-css-order": "^2.2.0",
    "prettier-plugin-organize-imports": "^4.3.0",
    "prettier-plugin-tailwindcss": "^0.8.0",
    "tailwindcss": "^4.3.0",
    "typescript": "^6.0.3",
    "typescript-eslint": "^8.60.0",
    "vite": "^8.0.14",
    "vitest": "^4.1.7",
    "vitest-axe": "^0.1.0",
    "vue-eslint-parser": "^10.4.0",
    "vue-tsc": "^3.3.3"
  }
}
```

- [ ] **Step 2: `templates/vue-app/tsconfig.json`** (inherits
      `include`/`exclude` from `vite-vue.json`)

```json
{
  "extends": "@busirocket/tsconfig/vite-vue.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 3: `templates/vue-app/vite.config.ts`**

```ts
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: `templates/vue-app/vitest.config.ts`**

```ts
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/test/**',
        'src/main.ts',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

- [ ] **Step 5: `templates/vue-app/eslint.config.ts`**

```ts
import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createCodeQualityConfig } from '@busirocket/eslint-config/code-quality'
import { createTailwindConfig } from '@busirocket/eslint-config/tailwind'
import { createViteVueConfig } from '@busirocket/eslint-config/vite-vue'
import path from 'node:path'

// Layer order: base → vite-vue (vue + a11y + boundaries) → code-quality → tailwind
export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createViteVueConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
  ...createTailwindConfig(),
  {
    files: ['**/*.{ts,vue}'],
    settings: {
      tailwindcss: {
        config: path.join(import.meta.dirname, 'src/styles.css'),
      },
    },
  },
  // Bootstrap/wiring files may hold multiple top-level statements.
  {
    files: ['src/main.ts', 'src/router/index.ts'],
    rules: {
      'code-policy/atomic-file': 'off',
    },
  },
]
```

- [ ] **Step 6: `templates/vue-app/prettier.config.mjs`**

```js
import frontend from '@busirocket/prettier-config/frontend'

/** @type {import('prettier').Config} */
export default { ...frontend }
```

- [ ] **Step 7: `templates/vue-app/.editorconfig`**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 8: `templates/vue-app/.npmrc`** (supply-chain cooldown; unknown
      keys are safely ignored by older pnpm)

```ini
engine-strict=true
auto-install-peers=true
minimum-release-age=1440
minimum-release-age-exclude[]=@busirocket/*
```

- [ ] **Step 9: `templates/vue-app/.lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 1,
      "staticDistDir": "./dist",
      "url": ["http://localhost/index.html"]
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["warn", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.9 }],
        "categories:performance": ["warn", { "minScore": 0.6 }]
      }
    }
  }
}
```

- [ ] **Step 10: `templates/vue-app/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue baseline</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 11: `templates/vue-app/public/robots.txt`**

```text
User-agent: *
Allow: /
```

- [ ] **Step 12: Install the workspace**

Run: `pnpm install` Expected: completes; `templates/vue-app` is linked as a
workspace package with all deps resolved.

- [ ] **Step 13: Commit**

```bash
git add templates/vue-app pnpm-lock.yaml
git commit -m "feat(vue-app): scaffold template config files"
```

---

## Task 5: `lib/add.ts` (establishes the test harness)

**Files:**

- Create: `templates/vue-app/src/lib/add.ts`,
  `templates/vue-app/src/lib/add.test.ts`, `templates/vue-app/src/test/setup.ts`

- [ ] **Step 1: Write the test setup**

`templates/vue-app/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'
import { expect } from 'vitest'

expect.extend(matchers)
```

- [ ] **Step 2: Write the failing test**

`templates/vue-app/src/lib/add.test.ts`:

```ts
import { expect, it } from 'vitest'

import { add } from './add'

it('adds two numbers', () => {
  expect(add(2, 3)).toBe(5)
})
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `pnpm --filter my-vue-app test` Expected: FAIL — cannot resolve `./add`.

- [ ] **Step 4: Implement**

`templates/vue-app/src/lib/add.ts`:

```ts
export const add = (a: number, b: number): number => a + b
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `pnpm --filter my-vue-app test` Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add templates/vue-app/src/lib/add.ts templates/vue-app/src/lib/add.test.ts templates/vue-app/src/test/setup.ts
git commit -m "feat(vue-app): add lib/add with test harness"
```

---

## Task 6: `env.ts` (Zod-validated, fail-fast)

**Files:**

- Create: `templates/vue-app/src/vite-env.d.ts`, `templates/vue-app/src/env.ts`,
  `templates/vue-app/src/env.test.ts`

- [ ] **Step 1: Write the typed env declaration**

`templates/vue-app/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 2: Write the failing test**

`templates/vue-app/src/env.test.ts`:

```ts
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('parses a valid VITE_API_BASE_URL', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
  const { env } = await import('./env')
  expect(env.VITE_API_BASE_URL).toBe('https://api.example.com')
})

it('throws when VITE_API_BASE_URL is not a valid URL', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'not-a-url')
  await expect(import('./env')).rejects.toThrow()
})
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `pnpm --filter my-vue-app test src/env.test.ts` Expected: FAIL — cannot
resolve `./env`.

- [ ] **Step 4: Implement (single export; schema is inline to satisfy the
      atomic-file rule)**

`templates/vue-app/src/env.ts`:

```ts
import { z } from 'zod'

export const env = z
  .object({
    VITE_API_BASE_URL: z.string().url(),
  })
  .parse(import.meta.env)
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `pnpm --filter my-vue-app test src/env.test.ts` Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add templates/vue-app/src/env.ts templates/vue-app/src/env.test.ts templates/vue-app/src/vite-env.d.ts
git commit -m "feat(vue-app): add Zod-validated fail-fast env"
```

---

## Task 7: `types/Greeting.ts` + `services/fetchGreeting.ts` (boundary validation)

**Files:**

- Create: `templates/vue-app/src/types/Greeting.ts`,
  `templates/vue-app/src/services/fetchGreeting.ts`,
  `templates/vue-app/src/services/fetchGreeting.test.ts`

- [ ] **Step 1: Write the type**

`templates/vue-app/src/types/Greeting.ts`:

```ts
export type Greeting = {
  message: string
}
```

- [ ] **Step 2: Write the failing test**

`templates/vue-app/src/services/fetchGreeting.test.ts`:

```ts
import { afterEach, expect, it, vi } from 'vitest'

import { fetchGreeting } from './fetchGreeting'

afterEach(() => {
  vi.restoreAllMocks()
})

it('returns the validated greeting', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'hello' }),
    }),
  )
  await expect(fetchGreeting('/api/greeting')).resolves.toEqual({
    message: 'hello',
  })
})

it('throws when the payload fails validation', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: '' }),
    }),
  )
  await expect(fetchGreeting('/api/greeting')).rejects.toThrow()
})

it('throws on a non-ok response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
  await expect(fetchGreeting('/api/greeting')).rejects.toThrow()
})
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `pnpm --filter my-vue-app test src/services/fetchGreeting.test.ts`
Expected: FAIL — cannot resolve `./fetchGreeting`.

- [ ] **Step 4: Implement (single export; Zod schema is local to the function)**

`templates/vue-app/src/services/fetchGreeting.ts`:

```ts
import { z } from 'zod'

import type { Greeting } from '@/types/Greeting'

export const fetchGreeting = async (url: string): Promise<Greeting> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Greeting request failed: ${response.status}`)
  }
  const payload: unknown = await response.json()
  return z.object({ message: z.string().min(1) }).parse(payload)
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `pnpm --filter my-vue-app test src/services/fetchGreeting.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add templates/vue-app/src/types/Greeting.ts templates/vue-app/src/services/fetchGreeting.ts templates/vue-app/src/services/fetchGreeting.test.ts
git commit -m "feat(vue-app): add greeting service with Zod boundary validation"
```

---

## Task 8: `stores/counter.ts` + `composables/useCounter.ts`

**Files:**

- Create: `templates/vue-app/src/stores/counter.ts`,
  `templates/vue-app/src/composables/useCounter.ts`

(No standalone unit test — these are exercised by the component test in Task 9,
which gives them coverage.)

- [ ] **Step 1: Write the Pinia store**

`templates/vue-app/src/stores/counter.ts`:

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  const increment = (): void => {
    count.value += 1
  }

  return { count, increment }
})
```

- [ ] **Step 2: Write the composable (shared → shared import is allowed by
      boundaries)**

`templates/vue-app/src/composables/useCounter.ts`:

```ts
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'

import { useCounterStore } from '@/stores/counter'

export const useCounter = (): {
  count: Ref<number>
  increment: () => void
} => {
  const store = useCounterStore()
  const { count } = storeToRefs(store)
  return { count, increment: store.increment }
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter my-vue-app type-check` Expected: exits 0 (no `.vue`
consumers yet, but the `.ts` files must type-check).

- [ ] **Step 4: Commit**

```bash
git add templates/vue-app/src/stores/counter.ts templates/vue-app/src/composables/useCounter.ts
git commit -m "feat(vue-app): add counter store and composable"
```

---

## Task 9: `TheCounter.vue` component + a11y test, plus app wiring

**Files:**

- Create: `templates/vue-app/src/components/TheCounter.vue`,
  `templates/vue-app/src/components/TheCounter.test.ts`,
  `templates/vue-app/src/App.vue`, `templates/vue-app/src/router/index.ts`,
  `templates/vue-app/src/main.ts`, `templates/vue-app/src/styles.css`

- [ ] **Step 1: Write the failing component test (behavior + axe a11y)**

`templates/vue-app/src/components/TheCounter.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

import TheCounter from './TheCounter.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('increments the count when the button is clicked', async () => {
  const wrapper = mount(TheCounter)
  await wrapper.get('[data-testid="increment"]').trigger('click')
  expect(wrapper.get('[data-testid="count"]').text()).toBe('1')
})

it('has no accessibility violations', async () => {
  const wrapper = mount(TheCounter)
  const results = await axe(wrapper.element)
  expect(results).toHaveNoViolations()
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter my-vue-app test src/components/TheCounter.test.ts` Expected:
FAIL — cannot resolve `./TheCounter.vue`.

- [ ] **Step 3: Implement the component**

`templates/vue-app/src/components/TheCounter.vue`:

```vue
<script setup lang="ts">
import { useCounter } from '@/composables/useCounter'

const { count, increment } = useCounter()
</script>

<template>
  <section class="flex flex-col items-center gap-2">
    <p data-testid="count">{{ count }}</p>
    <button
      class="rounded bg-blue-600 px-3 py-1 text-white"
      data-testid="increment"
      type="button"
      @click="increment"
    >
      Increment
    </button>
  </section>
</template>
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm --filter my-vue-app test src/components/TheCounter.test.ts` Expected:
PASS (2 tests, including the axe assertion).

- [ ] **Step 5: Write the styles, router, root component, and entry**

`templates/vue-app/src/styles.css`:

```css
@import 'tailwindcss';
```

`templates/vue-app/src/router/index.ts`:

```ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import TheCounter from '@/components/TheCounter.vue'

const routes: readonly RouteRecordRaw[] = [
  { path: '/', name: 'home', component: TheCounter },
]

export const router = createRouter({
  history: createWebHistory(),
  routes: [...routes],
})
```

`templates/vue-app/src/App.vue`:

```vue
<script setup lang="ts"></script>

<template>
  <main class="mx-auto max-w-md p-6">
    <h1 class="text-xl font-bold">Vue baseline</h1>
    <RouterView />
  </main>
</template>
```

`templates/vue-app/src/main.ts`:

```ts
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import { router } from '@/router'
import '@/styles.css'

createApp(App).use(createPinia()).use(router).mount('#app')
```

- [ ] **Step 6: Run the full test suite**

Run: `pnpm --filter my-vue-app test` Expected: PASS — all tests across add, env,
fetchGreeting, TheCounter.

- [ ] **Step 7: Commit**

```bash
git add templates/vue-app/src/components templates/vue-app/src/App.vue templates/vue-app/src/router templates/vue-app/src/main.ts templates/vue-app/src/styles.css
git commit -m "feat(vue-app): add counter component, router, and app entry"
```

---

## Task 10: Verify the full check pipeline and build

**Files:** none (verification only)

- [ ] **Step 1: Type-check with vue-tsc**

Run: `pnpm --filter my-vue-app type-check` Expected: exits 0 (includes `.vue`
template type-checking).

- [ ] **Step 2: Lint (Vue + a11y + boundaries + tailwind)**

Run: `pnpm --filter my-vue-app lint` Expected: exits 0.

If `projectService` on `.vue` reports "file not included in any project", debug
by confirming `templates/vue-app/tsconfig.json` inherits the `src/**/*.vue`
include from `vite-vue.json` (run
`pnpm --filter my-vue-app exec tsc --showConfig` and check the `include` array).
Do not silence the error with an ignore.

- [ ] **Step 3: Format check**

Run: `pnpm --filter my-vue-app format:check` Expected: exits 0. If it fails, run
`pnpm --filter my-vue-app format` and re-commit.

- [ ] **Step 4: Full CI check with coverage**

Run: `pnpm --filter my-vue-app test -- --coverage` Expected: PASS and coverage
thresholds (80%) met. If a threshold fails, the uncovered file is reported — add
a test or adjust the `coverage.exclude` list for genuinely untestable wiring (do
not lower the threshold).

- [ ] **Step 5: Production build**

Run: `pnpm --filter my-vue-app build` Expected: `vue-tsc --noEmit` passes, then
Vite emits `dist/`.

- [ ] **Step 6: Commit any formatting fixes**

```bash
git add -A templates/vue-app
git commit -m "chore(vue-app): apply formatting and verify check pipeline" || echo "nothing to commit"
```

---

## Task 11: Verify the architecture boundaries actually fire

**Files:** none (temporary edit, reverted)

- [ ] **Step 1: Introduce a forbidden import**

In `templates/vue-app/src/services/fetchGreeting.ts`, temporarily add at the top
of the imports:

```ts
import TheCounter from '@/components/TheCounter.vue'
```

- [ ] **Step 2: Lint and confirm the boundary error**

Run: `pnpm --filter my-vue-app lint` Expected: FAIL with a
`boundaries/element-types` error (a `services` file may not import a
`components` file).

- [ ] **Step 3: Revert the forbidden import**

Remove the line added in Step 1. Run `pnpm --filter my-vue-app lint` again.
Expected: exits 0.

(No commit — the working tree is back to its committed state.)

---

## Task 12: Update documentation

**Files:**

- Modify: `templates/README.md`, `README.md`

- [ ] **Step 1: Update `templates/README.md`**

Change the opening sentence:

```markdown
These folders are **validated starters** for Next.js, Vite + React, Astro, and a
generic TypeScript package.
```

to:

```markdown
These folders are **validated starters** for Next.js, Vite + React, Vite + Vue,
Astro, and a generic TypeScript package.
```

- [ ] **Step 2: Update the root `README.md` package table**

In `README.md`, change the `@busirocket/eslint-config` row to mention Vue:

```markdown
| `@busirocket/eslint-config` | `packages/eslint-config` | Flat ESLint configs —
base + nextjs / astro / vite-react / vite-vue / node |
```

and the `@busirocket/tsconfig` row:

```markdown
| `@busirocket/tsconfig` | `packages/tsconfig` | TypeScript configs — base + app
/ nextjs / astro / vite-react / vite-vue / node |
```

- [ ] **Step 3: Commit**

```bash
git add README.md templates/README.md
git commit -m "docs: mention vue-app template and vite-vue configs"
```

---

## Task 13: Final monorepo verification

**Files:** none (verification only)

- [ ] **Step 1: Clean install at the root**

Run: `pnpm install` Expected: completes with no errors; lockfile stable.

- [ ] **Step 2: Run the template's CI check end-to-end**

Run: `pnpm --filter my-vue-app check:ci` Expected: type-check, lint,
format:check, and tests all pass.

- [ ] **Step 3: Confirm the new shared exports resolve from the template**

Run:
`pnpm --filter my-vue-app exec node -e "console.log(require.resolve('@busirocket/tsconfig/vite-vue.json'))"`
Expected: prints the resolved path.

- [ ] **Step 4: Final commit (if anything changed)**

```bash
git add -A
git commit -m "chore: finalize vue-app template" || echo "nothing to commit"
```

---

## Self-review notes

- **Spec coverage:** flavor=SPA (Tasks 4-9); batteries-included
  router/Pinia/Zod/services (Tasks 6-9); Zod validation (Tasks 6, 7); env-Zod
  (Task 6); eslint-plugin-vue + vue-tsc (Tasks 3, 10); boundaries (Tasks 2, 11);
  supply-chain + coverage (Task 4 `.npmrc`, Task 10 coverage); shared exports
  tsconfig/eslint (Tasks 1, 3); frontend-boundaries composables (Task 2);
  READMEs (Task 12). All acceptance criteria map to Task 10/11/13.
- **Deviation from spec (intentional):** the a11y layer is
  `eslint-plugin-vuejs-accessibility` inside `vite-vue` rather than the shared
  jsx-a11y `createAccessibilityConfig`, because jsx-a11y does not lint `.vue`
  SFCs. Tailwind class-ordering on `.vue` is handled by
  `prettier-plugin-tailwindcss`; `eslint-plugin-tailwindcss` rule coverage on
  `.vue` is best-effort (it primarily targets ts/tsx/js/jsx) — noted, not
  silently dropped.
- **Type consistency:** `useCounterStore` (Task 8) used by `useCounter` (Task 8)
  and indirectly by `TheCounter.vue` (Task 9); `Greeting` type (Task 7) used by
  `fetchGreeting` (Task 7); `router` named export (Task 9) imported by `main.ts`
  (Task 9); `env` single export (Task 6). Component named `TheCounter`
  (multi-word, satisfies `vue/multi-word-component-names`).
