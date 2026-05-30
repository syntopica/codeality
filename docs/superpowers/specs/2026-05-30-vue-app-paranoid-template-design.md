# Design: `templates/vue-app` — Paranoid Vue 3 SPA template (2026, TypeScript)

Date: 2026-05-30
Status: Approved (design); pending implementation plan
Scope: This spec covers **only** `vue-app` (Vue 3 SPA on Vite). The `nuxt-app`
template is a separate follow-up sub-project with its own spec.

## Goal

Add a Vue 3 single-page-app starter to the `baseline` monorepo that mirrors the
existing `templates/vite-react-app` pattern and consumes the shared
`@busirocket/*` configs, while demonstrating "paranoid" 2026 best practices:
fail-fast env validation, template type-checking, layered architecture
boundaries, and supply-chain + coverage hardening.

The "paranoia" lives in **configuration and layers**, not in inflated features.
The runtime app is intentionally small (router + one store + one component + one
service) — just enough to demonstrate every practice exactly once.

## Decisions (locked)

- **Flavor:** Vue 3 SPA via Vite. (`nuxt-app` deferred to its own spec.)
- **Runtime stack:** batteries-included — `vue-router` (typed routes), `Pinia`,
  `Zod` boundary validation, a typed `services/` layer.
- **Validation library:** Zod (aligned with global "prefer Zod" rule).
- **Paranoid layers (all four):** env validated with Zod; `eslint-plugin-vue` +
  `vue-tsc`; architecture boundaries; supply-chain + coverage.
- **`eslint-plugin-vue` tier:** `flat/recommended` (the highest priority tier;
  includes essential + strongly-recommended + recommended). Stylistic conflicts
  with Prettier are neutralized by `eslint-config-prettier` (already in base).

## Context from the existing repo (verified)

- `tsconfig/base.json` already enables the full strict-hardening set
  (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `useUnknownInCatchVariables`). No need to re-declare.
- `eslint-config/src/base.ts` already applies `tseslint.configs.strictTypeChecked`
  plus `eslint-plugin-security`, `promise`, `import`, `unused-imports`.
- `eslint-config/src/frontend-boundaries.ts` models `components → shared →
  services` but its `shared` layer uses `hooks`, not `composables`.
- `pnpm-workspace.yaml` already globs `templates/*`, so a new template is picked
  up automatically. No workspace wiring needed.
- `@busirocket/prettier-config/frontend` formats `.vue` natively (no extra
  plugin).
- `create-baseline` is a dependency checker, **not** a scaffolder, so there is
  no template registry to update.

## Architecture

`vue-app` is a Vite SPA. ESLint layering matches `vite-react-app`:

```
base → vite-vue → code-quality → accessibility → tailwind
```

Type-checking is done by `vue-tsc` (understands `.vue` SFCs) instead of `tsc`.

### Folder layout (`templates/vue-app/`)

```
eslint.config.ts        # layered config; .vue included in tailwind settings
vite.config.ts          # vue() + tailwindcss() + '@' alias
vitest.config.ts        # vue(), jsdom, coverage v8 with thresholds
tsconfig.json           # extends @busirocket/tsconfig/vite-vue.json, paths @/*
index.html
prettier.config.mjs     # re-exports @busirocket/prettier-config/frontend
.editorconfig
.lighthouserc.json
.npmrc                  # engine-strict=true + minimumReleaseAge (cooldown)
public/robots.txt
src/
  main.ts               # createApp + use(router) + use(pinia) (atomic-file off)
  App.vue               # root SFC; <RouterView />
  env.ts                # Zod schema for import.meta.env; parsed once, exported typed
  vite-env.d.ts
  styles.css            # @import 'tailwindcss'
  router/
    index.ts            # typed routes (createRouter + RouteRecordRaw[])
  stores/
    counter.ts          # typed Pinia store (defineStore)
  composables/
    useCounter.ts       # composable wrapping the store (shared layer)
  services/
    fetchGreeting.ts    # fetch + Zod parse at the boundary; typed result
  types/
    Greeting.ts         # one type per file
  lib/
    add.ts              # pure fn (parity with React template's lib/add.ts)
  components/
    Counter.vue         # accessible example component
    Counter.test.ts     # component test + mandatory axe a11y assertion
  test/
    setup.ts            # jest-dom / vitest-axe setup
```

## Shared-package changes

These additions give Vue the same first-class support React/Astro already have.

### 1. `@busirocket/tsconfig` → new `vite-vue.json`

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "_comment": "Vite + Vue app — extends app, compiled/checked by vue-tsc.",
  "extends": "./app.json",
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

Add `"./vite-vue.json": "./vite-vue.json"` to the package `exports`.

### 2. `@busirocket/eslint-config` → new `src/vite-vue.ts`

`createViteVueConfig()` mirrors `createViteReactConfig()`:

- `vue.configs['flat/recommended']`.
- A `.vue` block setting `languageOptions.parser = vue-eslint-parser` with
  `parserOptions.parser = tseslint.parser`, `extraFileExtensions: ['.vue']`,
  and `projectService` for type-aware linting (same approach as `astro.ts`).
- A few explicit correctness rules, notably `vue/no-v-html: 'error'`
  (anti-XSS), plus `vue/define-props-declaration` and `vue/require-typed-ref`
  for typed component contracts.
- Reuse `createFrontendBoundariesConfig()`.

Add `"./vite-vue": "./src/vite-vue.ts"` to `exports`. Add `eslint-plugin-vue`
and `vue-eslint-parser` as **optional peerDependencies** (mirroring how
`eslint-plugin-astro` is declared) and as `devDependencies` so the config
package can lint/type-check its own source.

### 3. `frontend-boundaries.ts` → add `composables` to the `shared` layer

Append `composables/*`, `composables/**/*`, `src/composables/*`,
`src/composables/**/*` as `type: 'shared'` elements. Backward-compatible:
React/Astro consumers are unaffected. Update the JSDoc to mention Vue.

### 4. READMEs

- Root `README.md` table: note Vue in the `eslint-config` / `tsconfig` rows.
- `templates/README.md`: add Vue to the "validated starters" sentence.

## Paranoid layers — how each is realized

1. **Env validated with Zod** — `src/env.ts` defines a Zod schema for the
   `VITE_*` variables the app reads, calls `.parse(import.meta.env)` once at
   module load, and exports a typed `env` object. App code imports `env`,
   never raw `import.meta.env`. Missing/malformed config fails fast at startup.
2. **`eslint-plugin-vue` + `vue-tsc`** — `build = vue-tsc --noEmit && vite
   build`; `type-check = vue-tsc --noEmit`. Type errors inside `<template>` are
   caught. `vue/no-v-html` is an error.
3. **Architecture boundaries** — `eslint-plugin-boundaries` (already a repo
   dependency) enforces `components → composables/shared → services` with
   `boundaries/element-types: 'error'`. No cross-layer or internal-deep imports.
4. **Supply-chain + coverage** — dependency versions pinned with caret ranges
   consistent with the repo; `.npmrc` sets `engine-strict=true` and
   `minimumReleaseAge` (install cooldown against typosquat/compromised
   releases); Vitest enforces coverage thresholds via `@vitest/coverage-v8`; a
   `vitest-axe` accessibility assertion on `Counter.vue` is mandatory.

## Scripts (mirror `vite-react-app`, `tsc` → `vue-tsc`)

`dev`, `build` (`vue-tsc --noEmit && vite build`), `preview`, `lint`,
`lint:fix`, `fix`, `format`, `format:check`, `type-check` (`vue-tsc --noEmit`),
`test`, `test:watch`, `check:all`, `check:ci`, `test:a11y`, `perf:check`
(`lhci autorun`).

## Error model

`services/fetchGreeting.ts` demonstrates the boundary contract: fetch, validate
the response with Zod, and return a typed result; never propagate unvalidated
external data into the store/components.

## Testing

Vitest + `@vue/test-utils` + `jsdom` + `vitest-axe`. `Counter.test.ts` covers
behavior and includes an axe assertion. Coverage thresholds gate `check:ci`.

## Dependency versions

Vue-specific packages (`vue`, `vue-router`, `pinia`, `@vitejs/plugin-vue`,
`vue-tsc`, `eslint-plugin-vue`, `vue-eslint-parser`, `zod`,
`@vitest/coverage-v8`) are pinned during implementation to the latest stable
2026 releases, verified via Context7/npm, and aligned with the repo's existing
ranges (`vite ^8`, `vitest ^4`, `eslint ^10`, `typescript ^6`,
`typescript-eslint ^8.60`, `tailwindcss ^4.3`).

## Out of scope

- `nuxt-app` (separate follow-up spec).
- Any `create-baseline` changes (it is a checker, not a scaffolder).
- New Prettier plugin for Vue (the `frontend` config already handles `.vue`).

## Acceptance criteria

- `pnpm install` at the monorepo root resolves with the new template.
- In `templates/vue-app`: `pnpm check:ci` passes (type-check via `vue-tsc`,
  lint with the Vue + boundaries + a11y + tailwind layers, format check,
  tests including the axe assertion, coverage thresholds met).
- `pnpm build` produces a Vite bundle after a clean `vue-tsc` pass.
- Importing across layers in a way the boundaries forbid produces an ESLint
  error.
- Removing/breaking a required `VITE_*` var makes the app fail fast via the Zod
  env schema.
- The new `@busirocket/tsconfig/vite-vue.json` and
  `@busirocket/eslint-config/vite-vue` exports resolve and type-check.

## Post-implementation notes (2026-05-30)

- **`.npmrc` cooldown removed.** `minimum-release-age` leaked into the monorepo
  install (the dev machine also has a global pnpm `minimumReleaseAge` policy)
  and rewrote `pnpm-workspace.yaml` on every install. Per user decision the
  template `.npmrc` now carries only `engine-strict` and `auto-install-peers`;
  supply-chain cooldown is handled by the global policy. The remaining
  supply-chain paranoia (pinned versions, coverage thresholds, mandatory axe
  a11y test) stands.
- **Architecture-boundaries layer is currently inert (pre-existing,
  repo-wide).** The template wires `createFrontendBoundariesConfig` identically
  to the React/Astro/Next templates, but `eslint-plugin-boundaries` is at
  `6.0.2` while `frontend-boundaries.ts` targets the older (v3-era) element /
  `element-types` API. Under v6 every file classifies as `isUnknown`, so the
  rule never fires — verified to affect the React template equally. Making the
  boundaries layer actually enforce requires migrating
  `packages/eslint-config/src/frontend-boundaries.ts` to the v6 API and
  re-validating all four frontend templates. Tracked as a separate follow-up;
  out of scope for adding the Vue template (would risk the other templates'
  lint if done blindly).
- **`.vue` type-aware lint** uses a `src/shims-vue.d.ts` `*.vue` module shim so
  `.ts` files importing components are typed; `vue-tsc` still fully checks the
  SFCs. Vue-specific ESLint exceptions (declaration-file interfaces,
  composables-as-hooks placement, `<script setup>` bindings) live as overrides
  in the template `eslint.config.ts`, with `eslint-config-prettier` applied last
  to silence Vue formatting rules that conflict with Prettier.
