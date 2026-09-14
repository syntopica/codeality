# Code Quality Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cross-file quality gates (dead code, dependency graph, secrets,
vulnerable deps, package publishability, type-safety ratchet) to the baseline
monorepo and ship them to every template and to `create-baseline`.

**Architecture:** A new publishable package `@busirocket/quality-config` exports
config factories (TypeScript sources, no build step) consumed by three-line
config files in each template. Graph-wide gates (knip, dependency-cruiser) run
once at the repo root; per-project gates (type-coverage, ESLint suppressions)
run per workspace through Turbo. CI splits into three parallel jobs.

**Tech Stack:** pnpm 11 workspaces, Turborepo 2, ESLint 10 flat config,
TypeScript 6 alias (`@typescript/typescript6`), knip 6, dependency-cruiser 18,
type-coverage 2, lefthook 2, gitleaks, actionlint, publint,
`@arethetypeswrong/cli`, Renovate.

**Spec:** `docs/superpowers/specs/2026-08-02-code-quality-gates-design.md`

> **Task 11 is cancelled.** The Task 10 spike found `type-coverage` cannot run
> here: `type-coverage-core` throws
> `TypeError: Cannot read properties of undefined (reading 'Unknown')` on
> `ts.SyntaxKind.Unknown` at load time, unable to load the TypeScript module
> behind the `npm:@typescript/typescript6` alias. Module loading, not analysis,
> so no configuration fixes it. Every `types:coverage` script, Turbo task and
> `check:quality` component below is therefore dropped, and `type-coverage` does
> not join `THIRD_PARTY_PINS` in Task 17. The ESLint suppressions ratchet
> (Task 12) carries the type-safety half alone. Debt is in `TODO.md`.

## Global Constraints

- Every written artifact is in **English** — source, comments, identifiers,
  commit messages, docs. No exceptions.
- No AI/assistant attribution anywhere: no `Co-Authored-By`, no "Generated with"
  footer, no mention of Claude or Anthropic in commits or docs.
- **Atomic File Rule:** one file = one exported unit = one responsibility. No
  `utils.ts`/`helpers.ts` grab bags. Every dependency is an explicit `import`.
- Package conventions, copied from `packages/eslint-config`: `"type": "module"`,
  TypeScript sources exported directly via subpath `exports` (no build step),
  `PUBLIC_API.md` declaring which subpaths carry semver, third-party tools as
  **optional** peer dependencies, `engines.node >= 20`, `license: MIT`,
  `publishConfig.access: public`, `repository.directory` set.
- Pinned tool versions (verified 2026-08-02): knip `^6.31.0`, dependency-cruiser
  `^18.1.0`, type-coverage `^2.30.1`, publint `^0.3.22`, `@arethetypeswrong/cli`
  `^0.18.5`, lefthook `^2.1.10`, `@vitest/eslint-plugin` `^1.6.25`,
  `eslint-plugin-testing-library` `^7.16.2`.
- `eslint-plugin-vitest` is deprecated — never use it. The maintained package is
  `@vitest/eslint-plugin`.
- Node floor is **22** (`dependency-cruiser` requires `^22 || ^24 || >=26`; CI
  already pins 22).
- The eight templates are: `astro-site`, `nestjs-app`, `nextjs-app`, `nuxt-app`,
  `tauri-app`, `ts-package`, `vite-react-app`, `vue-app`. All are
  `private: true`.
- The five published npm packages are: `@busirocket/eslint-config`,
  `@busirocket/prettier-config`, `@busirocket/tsconfig`,
  `@busirocket/create-baseline`, `eslint-plugin-code-policy`. (`cargo-baseline`
  is a Rust crate with no `package.json`.)
- Never lower a threshold to make a gate pass. If a measured value comes in
  below the target, pin the threshold to the measured value and record the gap
  in `TODO.md` as debt.
- Gate verification is always: introduce a real violation, confirm the gate
  fails, revert. Verification artifacts are **never** committed.
- Run `pnpm check:all` before declaring any task complete.

---

## File Structure

**Created:**

| File                                                | Responsibility                                           |
| --------------------------------------------------- | -------------------------------------------------------- |
| `packages/quality-config/package.json`              | Package manifest, subpath exports, optional peers        |
| `packages/quality-config/tsconfig.json`             | Type-check config, extends `@busirocket/tsconfig`        |
| `packages/quality-config/src/knip.ts`               | `createKnipConfig` — one export                          |
| `packages/quality-config/src/knip-framework.ts`     | `KnipFramework` type + entry/project globs per framework |
| `packages/quality-config/src/dependency-cruiser.ts` | `createDepCruiserConfig` — one export                    |
| `packages/quality-config/src/type-coverage.ts`      | `TYPE_COVERAGE_THRESHOLD` constant                       |
| `packages/quality-config/src/lefthook.ts`           | `createLefthookConfig` — one export                      |
| `packages/quality-config/src/index.ts`              | Re-exports                                               |
| `packages/quality-config/PUBLIC_API.md`             | Semver-stable subpaths                                   |
| `packages/quality-config/README.md`                 | Usage                                                    |
| `packages/eslint-config/src/testing.ts`             | `createTestingConfig` — vitest + testing-library rules   |
| `knip.config.ts` (root)                             | Root knip config for the workspace                       |
| `.dependency-cruiser.cjs` (root)                    | Root dependency graph rules                              |
| `.gitleaks.toml` (root)                             | Secret-scanning allowlist                                |
| `lefthook.yml` (root + 8 templates)                 | Git hooks                                                |
| `renovate.json` (root + 8 templates)                | Dependency update policy                                 |
| `templates/*/knip.config.ts`                        | Three-line per-template knip config (8 files)            |
| `docs/standards/quality-gates.md`                   | Per-gate reference: what, threshold, why                 |

**Modified:**

| File                                               | Change                                                                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` (root)                              | New scripts: `knip`, `deps:graph`, `types:coverage`, `publish:check`, `lint:suppress`, `check:quality`, `check:security`; drops duplicated `dupes` (perf:check moved to a CI step, see Task 3) |
| `turbo.json`                                       | New tasks: `types:coverage`, `publish:check`, `lint:suppress`                                                                                                                                  |
| `packages/eslint-config/src/base.ts:87`            | `import/no-cycle` full depth                                                                                                                                                                   |
| `packages/eslint-config/src/code-quality.ts`       | Compose the new testing layer                                                                                                                                                                  |
| `packages/eslint-config/package.json`              | New `./testing` export, new optional peers                                                                                                                                                     |
| `templates/*/package.json`                         | `lint` gains `--max-warnings 0`; new `lint:suppress`, `lint:prune`, `types:coverage` (8 files)                                                                                                 |
| `packages/*/package.json`                          | Same, plus `publish:check` on published packages                                                                                                                                               |
| `.github/workflows/ci.yml`                         | Three parallel jobs                                                                                                                                                                            |
| `.github/workflows/publish.yml`                    | `quality-config` added to the package choice list                                                                                                                                              |
| `scripts/sync-versions.mjs`                        | `@busirocket/quality-config` in `BASELINE_CONSUMER_PACKAGES`; new tools in `THIRD_PARTY_PINS`                                                                                                  |
| `packages/create-baseline/bin/create-baseline.mjs` | Check for the new config files, matching the existing `eslint.config.*` check                                                                                                                  |
| `docs/adoption/existing-repo.md`                   | Freeze-and-ratchet adoption workflow                                                                                                                                                           |
| `README.md`                                        | Pipeline section covers the new gates                                                                                                                                                          |

---

## Tranche 1 — Free fixes

### Task 1: Make warn-level rules enforceable

Today no lint script passes `--max-warnings 0`, so `complexity: 10`,
`max-depth: 4`, `max-params: 4`, `max-lines-per-function: 50`, and
`sonarjs/no-duplicate-string` never fail CI. A baseline run on 2026-08-02
reported zero warnings across all 13 Turbo tasks, so this change should cost no
debt — but that must be confirmed, not assumed.

**Files:**

- Modify: `templates/astro-site/package.json`,
  `templates/nestjs-app/package.json`, `templates/nextjs-app/package.json`,
  `templates/nuxt-app/package.json`, `templates/tauri-app/package.json`,
  `templates/ts-package/package.json`, `templates/vite-react-app/package.json`,
  `templates/vue-app/package.json`
- Modify: `packages/eslint-config/package.json`,
  `packages/eslint-plugin-code-policy/package.json`

**Interfaces:**

- Consumes: nothing.
- Produces: every `lint` script fails on any warning. Task 12 adds
  `lint:suppress`/`lint:prune` as separate scripts alongside these; `lint`
  itself stays `--max-warnings 0` and remains the gate.

- [ ] **Step 1: Confirm the repo is currently clean (the failing-test
      equivalent)**

Run: `pnpm lint --force -- --max-warnings 0 2>&1 | tail -30`

Flag order matters: `--force` must land before pnpm's `--` so Turbo consumes it
as its own cache-bypass flag. Everything after `--` is forwarded to each
package's `eslint` invocation, which rejects `--force`.

Expected: exit 0. If it reports warnings, **stop and list them** — they must be
fixed in this task before the flag goes in, or the flag is a lie. Do not proceed
by relaxing rules.

- [ ] **Step 2: Add the flag to all eight templates**

Each template's `lint` and `lint:fix` keep their existing path arguments and
gain the flag. The paths differ per template — do not normalise them:

| Template         | New `lint` value                  |
| ---------------- | --------------------------------- |
| `astro-site`     | `eslint src --max-warnings 0`     |
| `nestjs-app`     | `eslint src --max-warnings 0`     |
| `nextjs-app`     | `eslint app src --max-warnings 0` |
| `nuxt-app`       | `eslint . --max-warnings 0`       |
| `tauri-app`      | `eslint src --max-warnings 0`     |
| `ts-package`     | `eslint src --max-warnings 0`     |
| `vite-react-app` | `eslint src --max-warnings 0`     |
| `vue-app`        | `eslint src --max-warnings 0`     |

Leave `lint:fix` without the flag — it is the fixing entry point, not a gate.

- [ ] **Step 3: Add the flag to the two linted packages**

`packages/eslint-config/package.json` and
`packages/eslint-plugin-code-policy/package.json`:
`"lint": "eslint src --max-warnings 0"`.

- [ ] **Step 4: Verify the gate is live**

Run: `pnpm lint --force` Expected: PASS, all tasks green.

- [ ] **Step 5: Prove the gate actually bites**

Append to `templates/ts-package/src/index.ts` a function at cyclomatic
complexity 11:

```ts
export const complexityProbe = (n: number): string => {
  if (n === 1) return 'a'
  if (n === 2) return 'b'
  if (n === 3) return 'c'
  if (n === 4) return 'd'
  if (n === 5) return 'e'
  if (n === 6) return 'f'
  if (n === 7) return 'g'
  if (n === 8) return 'h'
  if (n === 9) return 'i'
  if (n === 10) return 'j'
  return 'z'
}
```

Run: `pnpm --filter my-ts-package lint` Expected: FAIL with `complexity` warning
counted as an error.

- [ ] **Step 6: Revert the probe**

Run: `git checkout templates/ts-package/src/index.ts` Then:
`pnpm --filter my-ts-package lint` Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add templates/*/package.json packages/eslint-config/package.json packages/eslint-plugin-code-policy/package.json
git commit -m "fix(lint): fail on warnings with --max-warnings 0

complexity, max-depth, max-params, max-lines-per-function and
sonarjs/no-duplicate-string were warn-level and no lint script passed
--max-warnings 0, so none of them could fail CI. The repo reports zero
warnings today, so the flag costs no debt."
```

---

### Task 2: Detect import cycles at full depth

`packages/eslint-config/src/base.ts:87` caps `import/no-cycle` at `maxDepth: 1`,
which only finds direct A→B→A cycles. Longer cycles — the ones that actually
tangle large codebases — pass silently.

**Files:**

- Modify: `packages/eslint-config/src/base.ts:87`

**Interfaces:**

- Consumes: nothing.
- Produces: full-depth cycle detection in every consumer of
  `@busirocket/eslint-config/base`. Task 9 adds a second, graph-level cycle
  check via dependency-cruiser; they overlap deliberately (ESLint catches it at
  author time, dependency-cruiser catches it across package boundaries ESLint
  does not resolve).

- [ ] **Step 1: Write the failing case**

Create three files inside `templates/ts-package/src/`. The blank line after each
import is required: the repo enforces `import/newline-after-import` as an error,
and without it lint fails on formatting before `import/no-cycle` is ever
evaluated — masking the test.

```ts
// cycle-a.ts
import { fromB } from './cycle-b'

export const fromA = (): string => `a${fromB()}`
```

```ts
// cycle-b.ts
import { fromC } from './cycle-c'

export const fromB = (): string => `b${fromC()}`
```

```ts
// cycle-c.ts
import { fromA } from './cycle-a'

export const fromC = (): string => `c${String(fromA)}`
```

- [ ] **Step 2: Confirm the current config misses it**

Run: `pnpm --filter my-ts-package lint` Expected: PASS — proving `maxDepth: 1`
does not see a three-hop cycle.

- [ ] **Step 3: Remove the depth cap**

In `packages/eslint-config/src/base.ts`, replace:

```ts
'import/no-cycle': ['error', { maxDepth: 1 }],
```

with:

```ts
// No maxDepth: shallow caps miss exactly the long cycles that tangle
// large codebases. `allowUnsafeDynamicCyclicDependency` stays off.
'import/no-cycle': ['error', { ignoreExternal: true }],
```

**This alone does not work**, and Step 4 will still pass if you stop here.
`eslint-plugin-import` gates its export-map builder on
`settings['import/extensions']`, which defaults to `['.js', '.mjs', '.cjs']`.
The config never set it, so every `.ts` file was rejected before parsing and
`import/no-cycle` found nothing at any depth. The same mechanism silently
disabled `import/export`, `import/namespace`, and `import/no-unused-modules` on
TypeScript.

Extend the `settings` block in the same config object:

```ts
settings: {
  'import/resolver': { typescript: true },
  // Without this, eslint-plugin-import's export-map builder rejects .ts
  // outright and every cross-file import rule is silently inert.
  'import/extensions': ['.js', '.mjs', '.cjs', '.ts', '.tsx'],
},
```

- [ ] **Step 4: Confirm the cycle is now caught**

Run: `pnpm --filter my-ts-package lint` Expected: FAIL with `import/no-cycle` on
`cycle-a.ts`, `cycle-b.ts`, `cycle-c.ts`.

- [ ] **Step 5: Remove the probe files**

```bash
rm templates/ts-package/src/cycle-a.ts templates/ts-package/src/cycle-b.ts templates/ts-package/src/cycle-c.ts
```

- [ ] **Step 6: Verify the whole repo still passes**

Run: `pnpm lint --force` Expected: PASS. If a real cycle surfaces in the repo,
fix the cycle — do not restore the cap.

- [ ] **Step 7: Commit**

```bash
git add packages/eslint-config/src/base.ts
git commit -m "fix(eslint): detect import cycles at full depth

maxDepth: 1 only caught direct A->B->A cycles. Verified against a
three-hop cycle that the previous config passed."
```

---

### Task 3: Run the performance budget in CI and stop double-running dupes

`check:ci` never invoked `perf:check`, so the Lighthouse budgets in `nextjs-app`
and `vite-react-app` were dead config. It also runs `dupes` twice: once per
package through Turbo (which only sees within-package duplication) and once at
the root (the actual cross-file gate).

**Files:**

- Modify: `package.json` (root, `scripts.check:ci` and `scripts.check:all`)

**Interfaces:**

- Consumes: nothing.
- Produces: `check:ci` as the complete correctness gate. Task 15 splits
  `check:quality` and `check:security` out into sibling scripts and CI jobs.

- [ ] **Step 1: Confirm perf:check currently runs nowhere in CI**

Run: `grep -n "perf:check" package.json .github/workflows/ci.yml` Expected: it
appears in `package.json` as a standalone script only, and not at all in
`ci.yml`.

- [ ] **Step 2: Rewrite the two pipeline scripts**

In the root `package.json`:

```json
"check:all": "turbo run type-check lint:fix && pnpm format && pnpm dupes",
"check:ci": "pnpm sync-versions:check && turbo run type-check lint test build && pnpm format:check && pnpm dupes",
```

The per-package `dupes` is gone from the Turbo task list; the root `pnpm dupes`
is the cross-file gate and stays.

**`perf:check` does not go in `check:ci`.** That was the original instruction
and it does not work. Lighthouse cannot obtain a first contentful paint under
headless Chrome on macOS: `NO_FCP`, exit 1, reproduced both in an automated
shell and by the maintainer in an interactive terminal, and unchanged by
`--headless=new --no-sandbox` on all six templates. Inside `check:ci` it made
the pipeline permanently red on `vite-react-app` and `tauri-app` while passing
vacuously (`0 URL(s), 0 total run(s)`) elsewhere.

Add it instead as a step of the `verify` job in `.github/workflows/ci.yml`,
after the `check:ci` step:

```yaml
- name: Performance budget
  run: pnpm run perf:check
```

Carry that step forward when Task 15 splits the workflow into three jobs, and
comment it there so nobody moves it back into `check:ci`.

- [ ] **Step 3: Run the full pipeline**

Run: `pnpm check:ci` Expected: PASS, and the log shows Lighthouse running for
the six templates that define `perf:check` — `astro-site`, `nextjs-app`,
`nuxt-app`, `tauri-app`, `vite-react-app`, `vue-app`. The remaining two
(`nestjs-app`, `ts-package`) have no page to measure and are skipped by Turbo,
which is correct.

Two environment caveats, both established during execution:

- `nuxt-app` fails here with `Status code: 500` until its `.lighthouserc.json`
  passes `NUXT_PUBLIC_API_BASE_URL`. The built SSR server validates `apiBaseUrl`
  with `z.url()` and aborts on the empty default, so its Lighthouse run never
  worked — adding `perf:check` to `check:ci` is what surfaced it.
- Headless Chrome may report `NO_FCP` in a sandboxed shell, which makes the
  assertions pass vacuously. That is an environment limit, not a wiring defect;
  never weaken an assertion to work around it.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "fix(ci): run the performance budget and stop double-running dupes

perf:check was defined but never invoked by check:ci, so the Lighthouse
budgets were dead config. dupes ran twice: the per-package Turbo task
only sees within-package duplication, the root run is the real
cross-file gate."
```

---

## Tranche 2 — `@busirocket/quality-config`, knip, dependency-cruiser

### Task 4: Scaffold the quality-config package

**Files:**

- Create: `packages/quality-config/package.json`,
  `packages/quality-config/tsconfig.json`,
  `packages/quality-config/src/index.ts`, `packages/quality-config/README.md`,
  `packages/quality-config/PUBLIC_API.md`, `packages/quality-config/LICENSE`

**Interfaces:**

- Consumes: nothing.
- Produces: the package `@busirocket/quality-config`, resolvable as
  `workspace:*`. Tasks 5–9 add its exports. Task 17 registers it in
  `sync-versions.mjs` and `publish.yml`.

- [ ] **Step 1: Write the manifest**

`packages/quality-config/package.json`. The `exports` map lists subpaths added
by later tasks; each has a matching file created before that task ends.

```json
{
  "name": "@busirocket/quality-config",
  "version": "0.1.0",
  "private": false,
  "packageManager": "pnpm@11.18.0",
  "license": "MIT",
  "description": "Shared configuration for cross-file quality gates: knip, dependency-cruiser, type-coverage, lefthook",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/BusiRocket/baseline.git",
    "directory": "packages/quality-config"
  },
  "homepage": "https://github.com/BusiRocket/baseline/tree/main/packages/quality-config#readme",
  "bugs": {
    "url": "https://github.com/BusiRocket/baseline/issues"
  },
  "publishConfig": {
    "access": "public"
  },
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "files": ["LICENSE", "README.md", "src", "tsconfig.json", "PUBLIC_API.md"],
  "exports": {
    ".": "./src/index.ts",
    "./knip": "./src/knip.ts",
    "./dependency-cruiser": "./src/dependency-cruiser.ts",
    "./type-coverage": "./src/type-coverage.ts",
    "./lefthook": "./src/lefthook.ts"
  },
  "scripts": {
    "fix": "pnpm run lint:fix",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "type-check": "tsc --noEmit -p tsconfig.json"
  },
  "peerDependencies": {
    "dependency-cruiser": ">=18.0.0",
    "knip": ">=6.0.0",
    "typescript": ">=5.4.0"
  },
  "peerDependenciesMeta": {
    "dependency-cruiser": { "optional": true },
    "knip": { "optional": true }
  },
  "devDependencies": {
    "@busirocket/eslint-config": "workspace:*",
    "@busirocket/tsconfig": "workspace:*",
    "@types/node": "^26.1.2",
    "dependency-cruiser": "^18.1.0",
    "eslint": "^10.8.0",
    "knip": "^6.31.0",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

`engines.node` is `>=22` here, not `>=20` as in the sibling packages, because
`dependency-cruiser` 18 requires `^22 || ^24 || >=26`.

- [ ] **Step 2: Mirror the tsconfig and eslint setup from a sibling**

Copy the shape of `packages/eslint-config/tsconfig.json` and
`packages/eslint-config/eslint.config.ts` into `packages/quality-config/`,
changing only paths. Read the source files first — do not invent the contents.

- [ ] **Step 3: Write the placeholder barrel**

`packages/quality-config/src/index.ts`:

```ts
export { createKnipConfig } from './knip'
export { createDepCruiserConfig } from './dependency-cruiser'
export { TYPE_COVERAGE_THRESHOLD } from './type-coverage'
export { createLefthookConfig } from './lefthook'
```

This will not type-check until Tasks 5, 9, 11 and 16 land. Create the four files
as minimal stubs now so the barrel resolves; each later task replaces its stub
with the real implementation.

Stubs — one export per file, per the Atomic File Rule:

```ts
// src/type-coverage.ts
/** Minimum share of expressions with a non-`any` type, as a percentage. */
export const TYPE_COVERAGE_THRESHOLD = 99
```

For `knip.ts`, `dependency-cruiser.ts` and `lefthook.ts`, write the real
signature returning an empty object literal of the right type; Tasks 5, 9 and 16
fill in the bodies.

- [ ] **Step 4: Copy the LICENSE**

```bash
cp LICENSE packages/quality-config/LICENSE
```

- [ ] **Step 5: Write README.md and PUBLIC_API.md**

`PUBLIC_API.md` follows the table format of
`packages/eslint-config/PUBLIC_API.md` — read it first and match it. Rows: `.`,
`/knip`, `/dependency-cruiser`, `/type-coverage`, `/lefthook`.

- [ ] **Step 6: Install and type-check**

Run:
`pnpm install && pnpm --filter @busirocket/quality-config type-check && pnpm --filter @busirocket/quality-config lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/quality-config pnpm-lock.yaml
git commit -m "feat(quality-config): scaffold shared quality gate configuration package

Factories rather than static JSON, so eight templates share one source
instead of eight copies the jscpd gate would flag."
```

---

### Task 5: knip config factory

**Files:**

- Create: `packages/quality-config/src/knip-framework.ts`
- Modify: `packages/quality-config/src/knip.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type KnipFramework = 'astro' | 'nestjs' | 'nextjs' | 'nuxt' | 'tauri' | 'ts-package' | 'vite-react' | 'vite-vue'`
  - `const FRAMEWORK_ENTRIES: Record<KnipFramework, { entry: string[]; project: string[] }>`
  - `createKnipConfig(options: { framework: KnipFramework }): KnipConfig`

  Task 6 uses `createKnipConfig` at the root; Task 8 uses it in each template.

- [ ] **Step 1: Write the framework entry map**

`packages/quality-config/src/knip-framework.ts` — one exported unit (the map)
plus its type:

```ts
/** Entry and project globs per template framework, consumed by createKnipConfig. */
export type KnipFramework =
  | 'astro'
  | 'nestjs'
  | 'nextjs'
  | 'nuxt'
  | 'tauri'
  | 'ts-package'
  | 'vite-react'
  | 'vite-vue'

export const FRAMEWORK_ENTRIES: Record<
  KnipFramework,
  { entry: string[]; project: string[] }
> = {
  astro: {
    entry: ['src/pages/**/*.{astro,ts,tsx}', 'astro.config.*'],
    project: ['src/**/*.{astro,ts,tsx}'],
  },
  nestjs: {
    entry: ['src/main.ts', 'src/**/*.module.ts'],
    project: ['src/**/*.ts'],
  },
  nextjs: {
    entry: [
      'app/**/{page,layout,loading,error,not-found,route,template,default}.{ts,tsx}',
      'next.config.*',
      'middleware.ts',
    ],
    project: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  },
  nuxt: {
    entry: ['app/**/*.vue', 'server/**/*.ts', 'nuxt.config.*'],
    project: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
  },
  tauri: {
    entry: ['src/main.ts', 'vite.config.*'],
    project: ['src/**/*.{ts,tsx}'],
  },
  'ts-package': {
    entry: ['src/index.ts'],
    project: ['src/**/*.ts'],
  },
  'vite-react': {
    entry: ['src/main.tsx', 'index.html', 'vite.config.*'],
    project: ['src/**/*.{ts,tsx}'],
  },
  'vite-vue': {
    entry: ['src/main.ts', 'index.html', 'vite.config.*'],
    project: ['src/**/*.{ts,vue}'],
  },
}
```

- [ ] **Step 2: Write the factory**

`packages/quality-config/src/knip.ts`:

```ts
import type { KnipConfig } from 'knip'

import { FRAMEWORK_ENTRIES, type KnipFramework } from './knip-framework'

/**
 * Knip configuration for a baseline template.
 *
 * Rules that block: unused files, unused exports and exported types, declared
 * dependencies nobody imports, and imports of undeclared dependencies. Those
 * are the four findings a reviewer cannot see in a diff.
 *
 * `binaries` and `unresolved` stay non-blocking: pnpm script indirection and
 * Turbo produce false positives on both.
 */
export const createKnipConfig = (options: {
  framework: KnipFramework
}): KnipConfig => {
  const { entry, project } = FRAMEWORK_ENTRIES[options.framework]

  return {
    entry,
    project,
    ignoreBinaries: ['turbo', 'lhci'],
    rules: {
      files: 'error',
      dependencies: 'error',
      devDependencies: 'error',
      unlisted: 'error',
      exports: 'error',
      types: 'error',
      duplicates: 'error',
      binaries: 'warn',
      unresolved: 'warn',
    },
  }
}
```

- [ ] **Step 3: Type-check and lint**

Run:
`pnpm --filter @busirocket/quality-config type-check && pnpm --filter @busirocket/quality-config lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/quality-config/src
git commit -m "feat(quality-config): add knip config factory

Blocks on unused files, unused exports, unused and undeclared
dependencies. binaries and unresolved stay warn-level: pnpm script
indirection and turbo produce false positives on both."
```

---

### Task 6: Wire knip at the repo root

**Files:**

- Create: `knip.config.ts` (root)
- Modify: `package.json` (root — `devDependencies`, `scripts.knip`)

**Interfaces:**

- Consumes: `createKnipConfig` from Task 5.
- Produces: `pnpm knip` at the root. Task 15 folds it into `check:quality`.

- [ ] **Step 1: Add the dependency**

Run: `pnpm add -D -w knip@^6.31.0 @busirocket/quality-config@workspace:*`

- [ ] **Step 2: Write the root config**

Knip reads pnpm workspaces natively. The root config declares the workspace map;
each template's own `knip.config.ts` (Task 8) is **not** used by the root run,
so the root config carries per-workspace entry points:

`knip.config.ts`:

```ts
import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: ['scripts/*.mjs'],
      project: ['scripts/*.mjs'],
    },
    'packages/*': {
      entry: ['src/index.ts', 'src/*.ts', 'bin/*.mjs'],
      project: ['src/**/*.ts'],
    },
    'templates/*': {
      // Templates are scaffolding: their exports are consumed by the projects
      // generated from them, not from inside this repo. Only dependency
      // findings are meaningful here.
      entry: ['**/*.{ts,tsx,vue,astro}'],
      project: ['**/*.{ts,tsx,vue,astro}'],
    },
  },
  ignoreBinaries: ['turbo', 'lhci', 'gitleaks', 'actionlint'],
  rules: {
    files: 'error',
    dependencies: 'error',
    devDependencies: 'error',
    unlisted: 'error',
    exports: 'error',
    types: 'error',
    duplicates: 'error',
    binaries: 'warn',
    unresolved: 'warn',
  },
}

export default config
```

- [ ] **Step 3: Add the script**

Root `package.json`: `"knip": "knip"`.

- [ ] **Step 4: First run — expect noise, and tune**

Run: `pnpm knip`

The first run on an eight-template monorepo will report false positives. Tune
**only** by narrowing entry/project globs or adding specific
`ignoreDependencies` entries with a comment explaining each. Do **not** demote a
rule from `error` to `warn` to get green — that discards the finding.

For each remaining finding, decide: real dead code (delete it) or false positive
(narrow the glob). Record any judgement call you are unsure about in `TODO.md`
rather than silently ignoring it.

- [ ] **Step 5: Verify green**

Run: `pnpm knip` Expected: exit 0.

- [ ] **Step 6: Prove the gate bites**

Add to `packages/quality-config/src/knip.ts`:

```ts
/** Verification probe — nothing imports this. */
export const deadExportProbe = 'unused'
```

Run: `pnpm knip` Expected: FAIL, reporting `deadExportProbe` as an unused
export.

- [ ] **Step 7: Revert the probe and confirm green**

```bash
git checkout packages/quality-config/src/knip.ts
pnpm knip
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add knip.config.ts package.json pnpm-lock.yaml
git commit -m "feat(quality): add knip dead-code gate at the workspace root

Finds unused files, exports, and dependencies across package
boundaries. ESLint only sees within a single file, so this is the first
gate in the repo that can see code nothing reaches."
```

---

### Task 7: dependency-cruiser config factory

**Files:**

- Modify: `packages/quality-config/src/dependency-cruiser.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  `createDepCruiserConfig(options: { tsConfigPath?: string }): IConfiguration`
  (the `IConfiguration` type comes from `dependency-cruiser`). Task 9 consumes
  it at the root.

- [ ] **Step 1: Write the factory**

```ts
import type { IConfiguration } from 'dependency-cruiser'

/**
 * Graph-level architecture rules. Complements ESLint: `import/no-cycle` runs
 * per file and cannot resolve across package boundaries, while this runs over
 * the whole resolved module graph.
 */
export const createDepCruiserConfig = (
  options: { tsConfigPath?: string } = {},
): IConfiguration => ({
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Cycles make modules impossible to reason about or test in isolation.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      comment:
        'A module nothing imports and that is not an entry point is dead weight.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '(^|/)(babel|webpack|vite|vitest|eslint|knip)\\.config\\.(js|cjs|mjs|ts)$',
        ],
      },
      to: {},
    },
    {
      name: 'packages-must-not-depend-on-templates',
      severity: 'error',
      comment:
        'Templates are scaffolding output. A shared package reaching into one inverts the dependency.',
      from: { path: '^packages/' },
      to: { path: '^templates/' },
    },
    {
      name: 'no-dev-dep-in-production-code',
      severity: 'warn',
      comment:
        'A devDependency imported by shipped code will be missing at runtime for consumers.',
      from: { path: '^packages/[^/]+/src/', pathNot: '\\.(test|spec)\\.ts$' },
      to: { dependencyTypes: ['npm-dev'] },
    },
    {
      name: 'no-deprecated-core',
      severity: 'error',
      comment: 'Deprecated Node core modules are removed in future majors.',
      from: {},
      to: { dependencyTypes: ['core'], path: '^(punycode|domain|sys)$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: '(^|/)(dist|coverage|\\.next|\\.nuxt|\\.output|\\.astro|target)/',
    },
    tsPreCompilationDeps: true,
    tsConfig: options.tsConfigPath
      ? { fileName: options.tsConfigPath }
      : undefined,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue'],
    },
  },
})
```

- [ ] **Step 2: Type-check and lint**

Run:
`pnpm --filter @busirocket/quality-config type-check && pnpm --filter @busirocket/quality-config lint`
Expected: PASS. If `IConfiguration` rejects a property, read the installed type
at `node_modules/dependency-cruiser/types/configuration.d.mts` and correct the
shape — do not cast to `any` (the baseline bans it).

- [ ] **Step 3: Commit**

```bash
git add packages/quality-config/src/dependency-cruiser.ts
git commit -m "feat(quality-config): add dependency-cruiser config factory

Graph-level rules ESLint cannot express: cycles across package
boundaries, orphan modules, and packages reaching into templates."
```

---

### Task 8: Per-template knip configs

**Files:**

- Create: `templates/astro-site/knip.config.ts`,
  `templates/nestjs-app/knip.config.ts`, `templates/nextjs-app/knip.config.ts`,
  `templates/nuxt-app/knip.config.ts`, `templates/tauri-app/knip.config.ts`,
  `templates/ts-package/knip.config.ts`,
  `templates/vite-react-app/knip.config.ts`, `templates/vue-app/knip.config.ts`
- Modify: the eight matching `templates/*/package.json` (`devDependencies`,
  `scripts.knip`, `scripts.check:ci`)

**Interfaces:**

- Consumes: `createKnipConfig` and `KnipFramework` from Task 5.
- Produces: `pnpm knip` inside each scaffolded project.

- [ ] **Step 1: Write the eight config files**

Each is three lines. The `framework` value per template:

| File                                      | `framework`    |
| ----------------------------------------- | -------------- |
| `templates/astro-site/knip.config.ts`     | `'astro'`      |
| `templates/nestjs-app/knip.config.ts`     | `'nestjs'`     |
| `templates/nextjs-app/knip.config.ts`     | `'nextjs'`     |
| `templates/nuxt-app/knip.config.ts`       | `'nuxt'`       |
| `templates/tauri-app/knip.config.ts`      | `'tauri'`      |
| `templates/ts-package/knip.config.ts`     | `'ts-package'` |
| `templates/vite-react-app/knip.config.ts` | `'vite-react'` |
| `templates/vue-app/knip.config.ts`        | `'vite-vue'`   |

Content, with `<framework>` substituted:

```ts
import { createKnipConfig } from '@busirocket/quality-config/knip'

export default createKnipConfig({ framework: '<framework>' })
```

- [ ] **Step 2: Add dependency and scripts to each template**

In each `templates/*/package.json`:

- `devDependencies`: `"@busirocket/quality-config": "workspace:*"`,
  `"knip": "^6.31.0"`
- `scripts.knip`: `"knip"`
- `scripts.check:ci`: append `&& pnpm knip`

- [ ] **Step 3: Install**

Run: `pnpm install` Expected: PASS.

- [ ] **Step 4: Run knip in every template and tune**

Run: `pnpm -r --filter "./templates/*" knip`

Expect findings — templates hold scaffolding nothing imports yet. Tune by
narrowing the framework entry globs in
`packages/quality-config/src/knip-framework.ts`, which fixes all templates of
that framework at once. Real dead code gets deleted.

- [ ] **Step 5: Verify green**

Run: `pnpm -r --filter "./templates/*" knip` Expected: exit 0 for all eight.

- [ ] **Step 6: Commit**

```bash
git add templates pnpm-lock.yaml packages/quality-config/src/knip-framework.ts
git commit -m "feat(templates): add knip dead-code gate to all eight templates

Each template holds a three-line config extending the shared factory, so
the entry globs live in one place instead of eight copies."
```

---

### Task 9: Wire dependency-cruiser at the repo root

**Files:**

- Create: `.dependency-cruiser.cjs` (root)
- Modify: `package.json` (root — `devDependencies`, `scripts.deps:graph`)

**Interfaces:**

- Consumes: `createDepCruiserConfig` from Task 7.
- Produces: `pnpm deps:graph`. Task 15 folds it into `check:quality`.

- [ ] **Step 1: Add the dependency**

Run: `pnpm add -D -w dependency-cruiser@^18.1.0`

- [ ] **Step 2: Write the root config**

`dependency-cruiser` loads `.cjs` config natively; the factory is TypeScript, so
the root file imports the published subpath through `jiti`, which the repo
already depends on. Simpler and more robust: keep the root config a thin
CommonJS wrapper that requires the compiled-free TS through `jiti`.

`.dependency-cruiser.cjs`:

```js
// dependency-cruiser loads CommonJS config; the shared factory is TypeScript,
// so jiti (already a repo dependency) transpiles it on the fly.
const { createJiti } = require('jiti')

const jiti = createJiti(__filename)
const { createDepCruiserConfig } = jiti(
  '@busirocket/quality-config/dependency-cruiser',
)

module.exports = createDepCruiserConfig({ tsConfigPath: './tsconfig.json' })
```

If the root has no `tsconfig.json`, check first with `ls tsconfig.json`; if
absent, call `createDepCruiserConfig()` with no argument.

- [ ] **Step 3: Add the script**

Root `package.json`: `"deps:graph": "depcruise packages templates scripts"`.

- [ ] **Step 4: First run and tune**

Run: `pnpm deps:graph`

Tune by adjusting `exclude` paths in the factory, never by downgrading a rule to
`info`. Orphan findings in templates are common — templates have entry points
the graph cannot infer; extend the `no-orphans` `pathNot` list with a comment
for each pattern added.

- [ ] **Step 5: Verify green**

Run: `pnpm deps:graph` Expected: exit 0.

- [ ] **Step 6: Prove the gate catches a cycle ESLint misses**

Recreate the three-file cycle from Task 2 in `templates/ts-package/src/`
(`cycle-a.ts`, `cycle-b.ts`, `cycle-c.ts`, same contents).

Run: `pnpm deps:graph` Expected: FAIL with `no-circular`.

- [ ] **Step 7: Remove the probe and confirm green**

```bash
rm templates/ts-package/src/cycle-a.ts templates/ts-package/src/cycle-b.ts templates/ts-package/src/cycle-c.ts
pnpm deps:graph
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add .dependency-cruiser.cjs package.json pnpm-lock.yaml
git commit -m "feat(quality): add dependency-cruiser graph gate

Blocks cycles at full depth, orphan modules, and packages importing from
templates. Complements import/no-cycle, which runs per file and cannot
resolve across package boundaries."
```

---

## Tranche 3 — Type-safety ratchet

### Task 10: Verify type-coverage works against the TypeScript 6 alias

This repo aliases `typescript` to `npm:@typescript/typescript6` and type-checks
with `@typescript/native`. `type-coverage` consumes the TypeScript compiler API,
so compatibility is a genuine open question. **This task is a spike: its
deliverable is a yes/no answer plus the recorded evidence.** Task 11 is
conditional on it.

**Files:**

- Modify: `TODO.md` (create it if absent) if the answer is no

**Interfaces:**

- Consumes: nothing.
- Produces: a verdict consumed by Task 11.

- [ ] **Step 1: Try it in one package**

```bash
pnpm --filter @busirocket/eslint-config exec npx type-coverage@^2.30.1 --strict --detail 2>&1 | tail -20
```

- [ ] **Step 2: Record the outcome**

If it prints a percentage, note the number — Task 11 pins the threshold to it.
If it errors, capture the exact error line.

- [ ] **Step 3: If it fails, record the debt and skip Task 11**

Append to `TODO.md`:

```markdown
- [!] `type-coverage` incompatible with the `@typescript/typescript6` alias —
  blocked. Error: `<exact error line>`. Smallest unblock: retry after the repo
  moves off the alias to a released TypeScript 6, or evaluate
  `tsc --noEmit --strict` + a custom `as`-cast counter instead.
```

Then commit and mark Task 11 skipped:

```bash
git add TODO.md
git commit -m "docs(todo): record type-coverage incompatibility with the TS6 alias"
```

If it succeeds, no commit here — proceed to Task 11.

---

### Task 11: Wire type-coverage per workspace

**Conditional:** only if Task 10 returned a working percentage.

**Files:**

- Modify: `packages/quality-config/src/type-coverage.ts`
- Modify: eight `templates/*/package.json`,
  `packages/eslint-config/package.json`,
  `packages/eslint-plugin-code-policy/package.json`,
  `packages/quality-config/package.json`
- Modify: `turbo.json`, `package.json` (root)

**Interfaces:**

- Consumes: `TYPE_COVERAGE_THRESHOLD` from Task 4's stub, now given its real
  value.
- Produces: `pnpm types:coverage` at the root, fanning out through Turbo.

- [ ] **Step 1: Pin the threshold to the measured value**

`packages/quality-config/src/type-coverage.ts`:

```ts
/**
 * Minimum share of expressions with a non-`any` type, as a percentage.
 *
 * The baseline bans explicit `any`, so real coverage sits near 100%. This
 * number only ever moves up: when a project measures higher, raise it.
 */
export const TYPE_COVERAGE_THRESHOLD = 99
```

If Task 10 measured below 99, set this to the **measured floor rounded down**
and append the gap to `TODO.md` as debt. Never lower it for convenience beyond
the measured value.

This constant is the documented source of truth for the number; `package.json`
scripts cannot import TypeScript, so the same value is written literally into
each `types:coverage` script in the next step. When the threshold rises, both
places change together — the constant's doc comment says so.

- [ ] **Step 2: Add the dependency and script to every workspace**

In each of the eleven `package.json` files listed above:

- `devDependencies`: `"type-coverage": "^2.30.1"`
- `scripts.types:coverage`:
  `"type-coverage --at-least 99 --strict --ignore-files \"**/*.d.ts\""`

Substitute the pinned threshold for `99` if Step 1 changed it.

- [ ] **Step 3: Add the Turbo task**

In `turbo.json`, inside `tasks`:

```json
"types:coverage": {
  "dependsOn": ["^build"]
}
```

- [ ] **Step 4: Add the root script**

Root `package.json`: `"types:coverage": "turbo run types:coverage"`.

- [ ] **Step 5: Run it**

Run: `pnpm install && pnpm types:coverage` Expected: PASS everywhere.

- [ ] **Step 6: Prove the gate bites**

Add to `packages/quality-config/src/type-coverage.ts`:

```ts
/** Verification probe. */
export const castProbe = JSON.parse('{}') as unknown as { a: number }
```

Run: `pnpm --filter @busirocket/quality-config types:coverage` Expected: FAIL,
coverage below threshold.

- [ ] **Step 7: Revert and confirm**

```bash
git checkout packages/quality-config/src/type-coverage.ts
pnpm types:coverage
```

Expected: PASS. (This reverts the probe; re-apply Step 1's real content if the
checkout also removed it — check the file before moving on.)

- [ ] **Step 8: Commit**

```bash
git add . && git commit -m "feat(quality): add type-coverage gate

Explicit any is already banned, but as-casts, ts-expect-error and
untyped dependencies erode type safety invisibly. This measures what
survives and ratchets it."
```

---

### Task 12: ESLint bulk suppressions ratchet

Replaces betterer, which is unmaintained (last publish 2024-12-01, latest tag an
alpha, pre-flat-config). ESLint 10.8.0 has the mechanism natively.

**Files:**

- Modify: eight `templates/*/package.json`,
  `packages/eslint-config/package.json`,
  `packages/eslint-plugin-code-policy/package.json`,
  `packages/quality-config/package.json`
- Modify: `turbo.json`, `package.json` (root)
- Modify: `.gitignore`

**Interfaces:**

- Consumes: the `lint` scripts from Task 1.
- Produces: `lint:suppress` per workspace and `pnpm lint:suppress` at the root.
  Task 18 documents the adoption workflow that uses it.

- [ ] **Step 1: Confirm the flags exist in the installed ESLint**

Run:
`pnpm --filter my-nextjs-app exec eslint --help | grep -A5 "Suppressing Violations"`
Expected: lists `--suppress-all`, `--suppress-rule`, `--suppressions-location`,
`--prune-suppressions`, `--pass-on-unpruned-suppressions`.

- [ ] **Step 2: Add the prune script, kept off the gate**

Do not append `--prune-suppressions` to `lint` itself: ESLint prunes the
suppressions file to disk before it evaluates whether any entry is stale, so a
`lint` run carrying that flag always sees a freshly emptied file and passes
silently - putting it on the gate disables the gate. `lint` stays exactly as
Task 1 left it (`--max-warnings 0`). Add a separate `lint:prune` script instead,
mirroring each workspace's own lint paths. Example for `nextjs-app`:

```json
"lint:prune": "eslint app src --prune-suppressions",
```

That is the ratchet's cleanup half: a human runs it after fixing real debt to
remove the now-stale suppression entry. The suppression count can only go down.

- [ ] **Step 3: Add the freeze script to every workspace**

Mirroring each workspace's own lint paths:

```json
"lint:suppress": "eslint app src --suppress-all",
```

- [ ] **Step 4: Add the Turbo task**

In `turbo.json`:

```json
"lint:suppress": {
  "cache": false
}
```

`cache: false` because the task writes a file; a cached replay would produce no
file.

- [ ] **Step 5: Add the root script**

Root `package.json`: `"lint:suppress": "turbo run lint:suppress"`.

- [ ] **Step 6: Make sure suppression files are committed, not ignored**

Check `.gitignore` does not exclude `eslint-suppressions.json`. It must be
committed — it is the frozen baseline the whole team shares. Add an explanatory
comment near any nearby ESLint entries:

```gitignore
# eslint-suppressions.json is deliberately committed: it is the shared
# frozen baseline of pre-existing violations.
```

- [ ] **Step 7: Verify the repo is clean, so no suppression file is generated**

Run: `pnpm lint --force` Expected: PASS with no `eslint-suppressions.json`
created anywhere (`git status --short` stays clean). This monorepo has no debt
to freeze; the machinery exists for consumers.

- [ ] **Step 8: Prove the ratchet works end to end**

```bash
cd templates/ts-package
# introduce a violation
printf '\nexport const anyProbe = (x: any): any => x\n' >> src/index.ts
pnpm lint          # expect FAIL: @typescript-eslint/no-explicit-any
pnpm lint:suppress # freezes it
pnpm lint          # expect PASS: violation is suppressed
```

Then confirm the prune half:

```bash
git checkout src/index.ts   # fix the "debt"
pnpm lint                   # expect FAIL: unused suppression must be pruned
rm eslint-suppressions.json
pnpm lint                   # expect PASS
cd ../..
git status --short          # expect clean
```

- [ ] **Step 9: Commit**

```bash
git add templates/*/package.json packages/*/package.json turbo.json package.json .gitignore
git commit -m "feat(lint): add ESLint bulk suppressions ratchet

Lets an existing large codebase adopt the baseline by freezing current
violations and blocking new ones; --prune-suppressions forces removal
once real debt is fixed, so the count only falls.

Replaces betterer, unmaintained since 2024-12-01 and pre-flat-config."
```

---

### Task 13: Testing lint layer

**Files:**

- Create: `packages/eslint-config/src/testing.ts`
- Modify: `packages/eslint-config/src/code-quality.ts`,
  `packages/eslint-config/package.json`, `packages/eslint-config/PUBLIC_API.md`

**Interfaces:**

- Consumes: nothing.
- Produces: `createTestingConfig(): Linter.Config[]`, exported at
  `@busirocket/eslint-config/testing` and composed into
  `createCodeQualityConfig`.

- [ ] **Step 1: Add the plugins as optional peers and devDependencies**

`packages/eslint-config/package.json`:

- `peerDependencies`: `"@vitest/eslint-plugin": ">=1.0.0"`,
  `"eslint-plugin-testing-library": ">=7.0.0"`
- `peerDependenciesMeta`: both `{ "optional": true }`
- `devDependencies`: `"@vitest/eslint-plugin": "^1.6.25"`,
  `"eslint-plugin-testing-library": "^7.16.2"`
- `exports`: `"./testing": "./src/testing.ts"`

- [ ] **Step 2: Write the config**

`packages/eslint-config/src/testing.ts`:

```ts
import vitest from '@vitest/eslint-plugin'
import testingLibrary from 'eslint-plugin-testing-library'

/**
 * Test-file rules. These catch what review misses in a green build: a
 * committed `.only` silently skipping the rest of the suite, a test with no
 * assertion, and Testing Library queries whose promises are never awaited.
 *
 * `eslint-plugin-vitest` is deprecated; `@vitest/eslint-plugin` is its
 * maintained successor.
 */
export const createTestingConfig = () => [
  {
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
    ],
    plugins: { vitest, 'testing-library': testingLibrary },
    rules: {
      'vitest/no-focused-tests': ['error', { fixable: false }],
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-identical-title': 'error',
      'vitest/expect-expect': 'error',
      'vitest/valid-expect': 'error',
      'vitest/no-conditional-expect': 'error',
      'testing-library/await-async-queries': 'error',
      'testing-library/await-async-utils': 'error',
      'testing-library/no-await-sync-queries': 'error',
      'testing-library/no-container': 'error',
      'testing-library/no-node-access': 'warn',
      'testing-library/prefer-screen-queries': 'error',
    },
  },
]

export default createTestingConfig
```

- [ ] **Step 3: Compose it into code-quality**

In `packages/eslint-config/src/code-quality.ts`, add the import next to the
existing sonar import:

```ts
import { createTestingConfig } from './testing'
```

and add `...createTestingConfig(),` immediately after
`...createCodeQualitySonarConfig(),` in the returned array.

- [ ] **Step 4: Document the export**

Add a row to `packages/eslint-config/PUBLIC_API.md`:

| `@busirocket/eslint-config/testing` | Vitest + Testing Library rules for test
files |

- [ ] **Step 5: Install and run**

Run: `pnpm install && pnpm lint --force` Expected: PASS. Fix any real findings
in existing tests; do not disable a rule to get green.

- [ ] **Step 6: Prove the gate bites**

In any template's existing test file, change one `it(` to `it.only(`.

Run: `pnpm --filter <that-template> lint` Expected: FAIL with
`vitest/no-focused-tests`.

- [ ] **Step 7: Revert and confirm**

```bash
git checkout <that test file>
pnpm lint --force
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/eslint-config pnpm-lock.yaml
git commit -m "feat(eslint-config): add vitest and testing-library rules

Catches a committed .only silently skipping the suite, tests with no
assertion, and un-awaited async queries. All pass a green build today."
```

---

## Tranche 4 — Security and dependencies

### Task 14: Secret scanning with gitleaks

**Files:**

- Create: `.gitleaks.toml` (root)
- Modify: `package.json` (root — `scripts.secrets:check`)

**Interfaces:**

- Consumes: nothing.
- Produces: `pnpm secrets:check`. Task 15 folds it into `check:security`; Task
  16 adds it to the pre-push hook.

- [ ] **Step 1: Confirm gitleaks is available locally**

Run: `gitleaks version` If missing: `brew install gitleaks`, then re-run.

- [ ] **Step 2: Write the config**

`.gitleaks.toml`:

```toml
# Extends the upstream default ruleset; only additions and allowlists here.
[extend]
useDefault = true

[allowlist]
description = "Paths with no real secrets"
paths = [
  '''pnpm-lock\.yaml''',
  '''Cargo\.lock''',
  '''(^|/)dist/''',
  '''(^|/)coverage/''',
  '''(^|/)target/''',
]
```

- [ ] **Step 3: Add the script**

Root `package.json`: `"secrets:check": "gitleaks detect --no-banner --redact"`.

`--redact` keeps the matched secret out of CI logs, which are readable by anyone
with repo access.

- [ ] **Step 4: Run it against full history**

Run: `pnpm secrets:check` Expected: exit 0.

**If it reports a real finding, stop and report it to the user immediately** — a
leaked credential needs rotation, not an allowlist entry. Never silence a true
positive.

- [ ] **Step 5: Prove the gate bites**

```bash
printf 'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n' > /tmp/probe.env
cp /tmp/probe.env ./probe.env
git add probe.env && git commit -m "temp: gitleaks probe"
pnpm secrets:check
```

Expected: FAIL, reporting the AWS key.

- [ ] **Step 6: Remove the probe commit entirely**

```bash
git reset --hard HEAD~1
rm -f probe.env /tmp/probe.env
pnpm secrets:check
```

Expected: exit 0, and `git log --oneline -1` shows the pre-probe commit.

The `reset --hard` is safe here and only here: it drops exactly the probe commit
created two steps earlier, with no other uncommitted work in the tree. Confirm
`git status --short` is clean **before** running it.

- [ ] **Step 7: Commit**

```bash
git add .gitleaks.toml package.json
git commit -m "feat(security): add gitleaks secret scanning

Scans full history, not just the working tree. Lockfiles and build
output are allowlisted; findings are redacted so CI logs never echo a
credential."
```

---

### Task 15: Dependency audit, workflow lint, and the CI split

**Files:**

- Modify: `package.json` (root — `check:quality`, `check:security`,
  `audit:check`, `workflows:check`)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `knip` (Task 6), `deps:graph` (Task 9), `types:coverage` (Task 11),
  `secrets:check` (Task 14), `publish:check` (Task 17).
- Produces: three CI jobs. Task 17 adds `publish:check` into `check:quality`.

- [ ] **Step 1: Add the two remaining security scripts**

Root `package.json`:

```json
"audit:check": "pnpm audit --audit-level=high",
"workflows:check": "actionlint",
```

`--audit-level=high` deliberately ignores low and moderate advisories: a
moderate in a devDependency blocking every PR trains people to bypass the gate.

- [ ] **Step 2: Add the two aggregate scripts**

```json
"check:quality": "pnpm knip && pnpm deps:graph && pnpm types:coverage",
"check:security": "pnpm secrets:check && pnpm audit:check && pnpm workflows:check",
```

If Task 10 blocked type-coverage, omit `pnpm types:coverage` from
`check:quality` and note it in `TODO.md`.

- [ ] **Step 3: Run both locally**

Run: `pnpm check:quality && pnpm check:security` Expected: PASS. `actionlint`
may be absent locally — `brew install actionlint`.

- [ ] **Step 4: Rewrite the CI workflow with three parallel jobs**

`.github/workflows/ci.yml` — keep the existing `on:` and `concurrency:` blocks
unchanged, replace the `jobs:` block:

```yaml
jobs:
  verify:
    name: Verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: check:ci
        run: pnpm run check:ci

  quality:
    name: Quality gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: check:quality
        run: pnpm run check:quality

  security:
    name: Security gates
    runs-on: ubuntu-latest
    steps:
      # Full history: gitleaks cannot see a secret committed three commits ago
      # from a shallow clone.
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Secret scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITLEAKS_CONFIG: .gitleaks.toml
      - name: Dependency audit
        run: pnpm run audit:check
      - name: Workflow lint
        uses: raven-actions/actionlint@v2
```

The `security` job uses actions rather than `pnpm check:security` because
`gitleaks` and `actionlint` are binaries absent from a bare runner.
`check:security` remains the local-developer entry point; the job covers the
same three checks.

- [ ] **Step 5: Validate the workflow file before pushing**

Run: `actionlint` Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "feat(ci): split verification into three parallel jobs

verify, quality and security run concurrently, so wall-clock feedback
stays flat as gates are added and a failure names its own family.
gitleaks needs fetch-depth: 0 to see history."
```

---

### Task 16: Renovate and lefthook

**Files:**

- Create: `renovate.json` (root), `lefthook.yml` (root),
  `templates/*/renovate.json` (8), `templates/*/lefthook.yml` (8)
- Modify: `packages/quality-config/src/lefthook.ts`
- Modify: `package.json` (root — `devDependencies`, `scripts.prepare`)

**Interfaces:**

- Consumes: `secrets:check` (Task 14).
- Produces: `createLefthookConfig(): LefthookConfig` and installed git hooks.

- [ ] **Step 1: Write the Renovate config**

`renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", ":dependencyDashboard", ":semanticCommits"],
  "timezone": "Europe/Madrid",
  "schedule": ["before 6am on monday"],
  "labels": ["dependencies"],
  "rangeStrategy": "bump",
  "postUpdateOptions": ["pnpmDedupe"],
  "packageRules": [
    {
      "description": "Patch and minor devDependency bumps are noise; batch and auto-merge them.",
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["patch", "minor"],
      "groupName": "dev dependencies",
      "automerge": true
    },
    {
      "description": "Lint and type tooling moves together; a split bump half-applies a rule change.",
      "matchPackagePatterns": ["^eslint", "^@typescript-eslint", "^typescript"],
      "groupName": "lint and type tooling"
    },
    {
      "description": "Major bumps always get a human.",
      "matchUpdateTypes": ["major"],
      "automerge": false
    }
  ],
  "vulnerabilityAlerts": {
    "labels": ["security"],
    "automerge": true
  }
}
```

Copy this file verbatim into each of the eight templates so scaffolded repos
inherit it.

- [ ] **Step 2: Write the lefthook factory**

`packages/quality-config/src/lefthook.ts`:

```ts
/**
 * Git hook configuration.
 *
 * pre-commit is limited to staged files and skips type-check and tests
 * deliberately: CI already covers both, and a hook that takes 40 seconds gets
 * disabled within a week.
 */
export const createLefthookConfig = () => ({
  'pre-commit': {
    parallel: true,
    commands: {
      lint: {
        glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs}',
        run: 'pnpm exec eslint --max-warnings 0 --no-warn-ignored {staged_files}',
      },
      format: {
        glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs,json,md,css,yml,yaml}',
        run: 'pnpm exec prettier --check {staged_files}',
      },
    },
  },
  'pre-push': {
    commands: {
      secrets: {
        run: 'gitleaks detect --no-banner --redact',
      },
    },
  },
})
```

- [ ] **Step 3: Write the YAML that mirrors the factory**

lefthook reads YAML, not TypeScript. `lefthook.yml` at the root:

```yaml
# Mirrors createLefthookConfig() in @busirocket/quality-config/lefthook, which
# is what create-baseline uses to generate this file for new projects.
pre-commit:
  parallel: true
  commands:
    lint:
      glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs}'
      run: pnpm exec eslint --max-warnings 0 --no-warn-ignored {staged_files}
    format:
      glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs,json,md,css,yml,yaml}'
      run: pnpm exec prettier --check {staged_files}

pre-push:
  commands:
    secrets:
      run: gitleaks detect --no-banner --redact
```

Copy the same file into each of the eight templates.

- [ ] **Step 4: Install lefthook and wire the prepare hook**

Run: `pnpm add -D -w lefthook@^2.1.10`

Root `package.json`: `"prepare": "lefthook install"`.

Add `"lefthook": "^2.1.10"` to each template's `devDependencies` and
`"prepare": "lefthook install"` to each template's scripts.

- [ ] **Step 5: Install the hooks**

Run: `pnpm install && pnpm exec lefthook install` Expected:
`.git/hooks/pre-commit` and `.git/hooks/pre-push` exist.

- [ ] **Step 6: Prove the pre-commit hook blocks a bad commit**

```bash
printf '\nexport const hookProbe = (x: any): any => x\n' >> templates/ts-package/src/index.ts
git add templates/ts-package/src/index.ts
git commit -m "temp: hook probe"
```

Expected: the commit is **rejected** by the lint hook.

- [ ] **Step 7: Clean up**

```bash
git reset
git checkout templates/ts-package/src/index.ts
git status --short
```

Expected: only the intended new files remain staged/untracked.

- [ ] **Step 8: Commit**

```bash
git add renovate.json lefthook.yml templates package.json packages/quality-config/src/lefthook.ts pnpm-lock.yaml
git commit -m "feat(quality): add Renovate policy and lefthook git hooks

Renovate batches dev dependency patches and auto-merges vulnerability
fixes; majors always get a human. Hooks run lint and format over staged
files only, and gitleaks on push. Type-check and tests stay in CI."
```

---

## Tranche 5 — Distribution

### Task 17: Package publishability gate

**Files:**

- Modify: `packages/eslint-config/package.json`,
  `packages/prettier-config/package.json`, `packages/tsconfig/package.json`,
  `packages/create-baseline/package.json`,
  `packages/eslint-plugin-code-policy/package.json`,
  `packages/quality-config/package.json`
- Modify: `turbo.json`, `package.json` (root), `.github/workflows/publish.yml`,
  `scripts/sync-versions.mjs`

**Interfaces:**

- Consumes: nothing.
- Produces: `pnpm publish:check`, folded into `check:quality`.

- [ ] **Step 1: Add the tools and script to each published package**

In all six `packages/*/package.json`:

- `devDependencies`: `"publint": "^0.3.22"`,
  `"@arethetypeswrong/cli": "^0.18.5"`
- `scripts.publish:check`:
  `"publint --strict && attw --pack . --profile node16"`

- [ ] **Step 2: Add the Turbo task**

`turbo.json`:

```json
"publish:check": {
  "dependsOn": ["^build", "build"]
}
```

`build` (not just `^build`) because `eslint-plugin-code-policy` publishes
`dist/`, which must exist before its `exports` map can be validated.

- [ ] **Step 3: Add the root script and fold it into check:quality**

Root `package.json`:

```json
"publish:check": "turbo run publish:check",
"check:quality": "pnpm knip && pnpm deps:graph && pnpm types:coverage && pnpm publish:check",
```

- [ ] **Step 4: Run it and fix real findings**

Run: `pnpm publish:check`

`attw` will likely flag the TypeScript-source packages (`eslint-config`,
`quality-config`), which ship `.ts` directly rather than compiled output with
declarations. That is a deliberate, documented choice in this repo, not a
defect. Where a finding reflects that choice, add the specific rule to the
package's `attw` invocation with a comment, e.g. `--ignore-rules no-resolution`,
and record the reasoning in that package's `PUBLIC_API.md`. Do not
blanket-disable `attw`.

- [ ] **Step 5: Register quality-config for publishing**

`.github/workflows/publish.yml`: add `- quality-config` to the `package` input
`options` list.

`scripts/sync-versions.mjs`: add `'@busirocket/quality-config'` to
`BASELINE_CONSUMER_PACKAGES`, and add the new third-party pins to
`THIRD_PARTY_PINS`:

```js
const THIRD_PARTY_PINS = {
  jscpd: '^5.0.14',
  knip: '^6.31.0',
  'dependency-cruiser': '^18.1.0',
  'type-coverage': '^2.30.1',
  lefthook: '^2.1.10',
}
```

Omit `type-coverage` if Task 10 blocked it.

- [ ] **Step 6: Verify the sync**

Run: `pnpm sync-versions && pnpm sync-versions:check` Expected: PASS, and
`packages/create-baseline/baseline-versions.json` now contains the new entries.

- [ ] **Step 7: Prove the gate bites**

In `packages/tsconfig/package.json`, point one `exports` subpath at a
nonexistent file.

Run: `pnpm --filter @busirocket/tsconfig publish:check` Expected: FAIL.

- [ ] **Step 8: Revert and confirm**

```bash
git checkout packages/tsconfig/package.json
pnpm publish:check
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages turbo.json package.json .github/workflows/publish.yml scripts/sync-versions.mjs
git commit -m "feat(quality): validate package publishability

publint and attw catch broken exports maps and unresolvable types before
a consumer does. quality-config joins the publish workflow and the
version sync so consumer pins cannot drift."
```

---

### Task 18: Documentation and create-baseline

**Files:**

- Create: `docs/standards/quality-gates.md`
- Modify: `docs/adoption/existing-repo.md`, `docs/adoption/new-repo.md`,
  `README.md`, `packages/create-baseline/*` (scaffolding),
  `packages/create-baseline/README.md`

**Interfaces:**

- Consumes: every gate from Tasks 1–17.
- Produces: the adoption path. Terminal task.

- [ ] **Step 1: Write the gate reference**

`docs/standards/quality-gates.md`, one section per gate, each answering: what it
detects, where it runs, its threshold, why that threshold, and how to handle a
false positive. Cover: `--max-warnings 0`, `import/no-cycle`, jscpd, knip,
dependency-cruiser, type-coverage, ESLint suppressions, vitest/testing-library
rules, gitleaks, `pnpm audit`, actionlint, publint/attw, lefthook, Renovate.

State plainly for each: **never lower a threshold to get green.**

- [ ] **Step 2: Document the freeze-and-ratchet adoption workflow**

Add to `docs/adoption/existing-repo.md`:

````markdown
## Adopting on a codebase with existing violations

A large existing codebase will report thousands of violations on day one. Freeze
them instead of fixing them all up front, then let the count fall:

```bash
pnpm lint:suppress   # writes eslint-suppressions.json — commit it
pnpm lint            # passes: existing violations are frozen, new ones fail
```

`eslint-suppressions.json` is committed deliberately: it is the shared baseline.

`lint` runs plain `eslint --max-warnings 0`. That alone is the ratchet: ESLint
checks the committed suppressions file for entries that no longer match a real
violation and fails with an explicit message when it finds one - so fixing real
debt makes its suppression stale and `lint` fails until the entry is removed
with `pnpm lint:prune`. The suppression count can therefore only go down. Never
regenerate the file with `--suppress-all` to clear a failure - that re-freezes
debt someone just paid off.
````

- [ ] **Step 3: Extend create-baseline's config check**

`packages/create-baseline/bin/create-baseline.mjs` (138 lines) does **not** copy
files. It reads `baseline-versions.json`, reports which baseline packages are
missing from the target's `package.json`, and under `--hard` asserts an
`eslint.config.*` exists (`hasEslintConfig`, lines 45–61). Follow that shape
rather than adding a scaffolder.

Add a sibling check next to `hasEslintConfig`, as its own function per the
Atomic File Rule — a new file is not possible here (the CLI is a single
published `.mjs`), so keep it a separate top-level function in the same file,
matching how `hasEslintConfig` already sits alongside `missingBaseline`:

```js
const QUALITY_CONFIG_FILES = [
  'knip.config.ts',
  'knip.config.js',
  'lefthook.yml',
  'renovate.json',
]

async function missingQualityConfigs(root) {
  const missing = []
  for (const name of QUALITY_CONFIG_FILES) {
    try {
      await readFile(resolve(root, name))
    } catch {
      missing.push(name)
    }
  }
  return missing
}
```

`knip.config.ts` and `knip.config.js` are alternatives — treat the pair as
satisfied if either exists, so filter the report accordingly rather than
demanding both.

Wire it into `main()` in the `--soft` branch as advice, and into the `--hard`
branch as a failure, matching the existing `eslintOk` handling exactly (lines
105–109 and 121–126). `@busirocket/quality-config` already reaches
`baseline-versions.json` through Task 17's `sync-versions.mjs` change, so the
install line needs no edit.

- [ ] **Step 4: Update the README pipeline section**

In `README.md`, extend the "Turborepo & Check Pipeline" section to describe the
three CI jobs and name each new gate in one line, matching the existing tone.

- [ ] **Step 5: Verify the CLI against a bare project**

```bash
mkdir -p /tmp/baseline-cli-probe && cd /tmp/baseline-cli-probe
printf '{"name":"probe","private":true}\n' > package.json
node /Users/cristiandeluxe/p/codeality/packages/create-baseline/bin/create-baseline.mjs --soft
node /Users/cristiandeluxe/p/codeality/packages/create-baseline/bin/create-baseline.mjs --hard; echo "exit=$?"
```

Expected: `--soft` lists `knip.config.ts`, `lefthook.yml` and `renovate.json` as
missing; `--hard` exits 1 naming them.

Then confirm the inverse:

```bash
touch knip.config.ts lefthook.yml renovate.json
node /Users/cristiandeluxe/p/codeality/packages/create-baseline/bin/create-baseline.mjs --hard; echo "exit=$?"
```

Expected: the config-file check no longer complains (the run still exits 1 on
missing baseline packages, which is correct for a bare project).

- [ ] **Step 6: Clean up the probe**

```bash
cd /Users/cristiandeluxe/p/codeality && rm -rf /tmp/baseline-cli-probe
```

- [ ] **Step 7: Full pipeline run**

```bash
cd /Users/cristiandeluxe/p/codeality
pnpm check:all && pnpm check:quality && pnpm check:security
```

Expected: all three PASS.

- [ ] **Step 8: Commit**

```bash
git add docs README.md packages/create-baseline
git commit -m "docs: document the quality gates and the adoption ratchet

create-baseline now scaffolds knip, lefthook and Renovate configs, so a
new project inherits every gate instead of only the linting."
```

---

## Final Acceptance

- [ ] `pnpm check:all` passes
- [ ] `pnpm check:quality` passes
- [ ] `pnpm check:security` passes
- [ ] `git status --short` is clean — no verification probe survived
- [ ] `grep -rn "eslint-disable" --include="*.ts" packages/quality-config/src`
      returns nothing
- [ ] CI is green across `verify`, `quality`, and `security`
- [ ] Any gate that was dropped (e.g. type-coverage, per Task 10) is recorded in
      `TODO.md` with the exact blocker and the smallest unblocking action
