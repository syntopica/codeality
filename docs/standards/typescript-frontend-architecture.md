# TypeScript frontend architecture and ESLint standard

Opinionated, implementation-ready standard for medium and large TypeScript
frontends. This repository encodes parts of it in `@vibracomet/eslint-config`;
the rest is team process and review.

---

### 1. Recommended plugin stack

#### Essential

| Tool                                        | Purpose                                                      | Why                                           | Maturity  | Enforcement                                                                          |
| ------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| **ESLint core** (`no-*`, `max-*`)           | File length, function length, complexity, depth, arity       | Stable, zero extra deps, works in flat config | Universal | **Hard** for `max-lines` at 100 (this baseline); **soft** for complexity-style rules |
| **typescript-eslint** (strict + type-aware) | TS correctness, unsafe patterns, consistent type imports     | Industry default for TS                       | Very high | **Hard** on correctness rules                                                        |
| **eslint-plugin-import**                    | Cycles, duplicates, self-imports, first/import order hygiene | Prevents architectural drift and barrel chaos | Very high | **Hard** on hygiene rules in this baseline                                           |

#### Strongly recommended

| Tool                                                    | Purpose                                                                      | Why                                                        | Maturity              | Enforcement                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------- | ------------------------------------------------------ |
| **eslint-plugin-code-policy** (this repo)               | One export per file, no inline types, view vs hook split, public API imports | Encodes “single unit per file” and UI vs logic separation  | Newer; project-scoped | **Hard** where configured                              |
| **eslint-plugin-sonarjs**                               | Duplicated branches/functions, repeated string literals                      | Catches copy-paste and smell                               | High                  | **Hard** on duplication; **soft** on duplicate strings |
| **eslint-plugin-boundaries**                            | Layer rules (app / components / shared / services)                           | Best practical “folder architecture” enforcement in ESLint | High                  | **Hard** on disallowed edges                           |
| **eslint-plugin-react** + **eslint-plugin-react-hooks** | React correctness                                                            | Required for React codebases                               | Very high             | **Hard** on selected rules                             |
| **eslint-config-prettier**                              | Disable stylistic ESLint rules                                               | Avoid fighting Prettier                                    | Universal             | N/A                                                    |

#### Optional

| Tool                            | Purpose                                      | Why optional                                                                     | Notes                                                                    |
| ------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **eslint-plugin-unicorn**       | Modern JS/Node idioms                        | Can conflict with framework quirks; enable rule-by-rule                          | Used in `@vibracomet/eslint-config/node` for `prefer-node-protocol` only |
| **eslint-plugin-perfectionist** | Sort keys, imports, etc.                     | **Conflicts** with `prettier-plugin-organize-imports` if both touch import order | If used: enable **object/array** sorting only; let Prettier own imports  |
| **eslint-plugin-security**      | Unsafe eval, weak randomness, risky fs paths | High false positives in some apps                                                | Enabled in `@vibracomet/eslint-config/base` with selected rules          |
| **eslint-plugin-promise**       | Promise hygiene                              | Nice-to-have                                                                     | Enabled in base as warnings                                              |

#### What ESLint cannot solve reliably

- **“Single responsibility”** in the human sense (orchestrator vs “too much”) —
  no mature rule understands domain steps; use **review** + **small
  functions** + **complexity / max-lines-per-function** as proxies.
- **Dual severity for the same file** (warn at 50 lines and error at 100) with
  **one** core `max-lines` rule — ESLint applies **one** severity per rule per
  file; the last matching config wins. See section 5 for the practical approach.
- **Provider leak** — boundaries + `code-policy/public-api-imports` help;
  **review** still required for DTO shapes and error types crossing layers.

---

### 2. Recommended architecture

Final folder model (paths may live under `src/` or project root; both are
supported by `@vibracomet/eslint-config/frontend-boundaries`):

```text
src/
  app/                         # Routes, layouts, route handlers (framework-specific)
  components/
    ComponentName/
      ComponentName.tsx
      types/                   # Component-private types (one type per file)
      hooks/                   # Component-local hooks
      utils/                   # Component-local pure helpers
      const/                   # Component-local constants
  services/
    service-name/
      types/
      hooks/                   # Integration-specific hooks (e.g. Supabase query hooks)
      utils/                   # Thin adapters, mappers, narrow API wrappers
  const/                       # Shared constants (after proven reuse)
  types/                       # Shared types (after proven reuse)
  hooks/                       # Shared hooks (after proven reuse)
  utils/                       # Shared pure utilities (after proven reuse)
  lib/                         # Optional: shared non-UI helpers (project convention)
  store/                       # Optional: global client state
```

**Responsibilities**

- **`components/`** — UI composition, minimal logic; no direct SDK calls; prefer
  colocated `hooks/` for state and effects.

#### TSX presentation contract

`.tsx` files are **view modules**: they should **render** and wire **thin**
presentation concerns. Anything that looks like **application or data logic**
belongs in hooks, services, or server layers — not in the TSX file.

**Allowed in `.tsx` (examples)**

- JSX structure, composition, and conditional rendering driven by **props** or
  **small** hook outputs (e.g. `{isOpen && <Panel />}`).
- **Trivial UI derivations**: class names (`cn`, variant maps), spacing or size
  math for layout, deriving a display color or token from props/theme, simple
  formatting that only shapes what is shown (e.g. one-line label from a
  boolean).
- Event handlers that **only** forward to props or to a **single** hook method
  (e.g. `onClick={handleClose}` where `handleClose` comes from `useDialog()`).

**Not allowed in `.tsx` (must live elsewhere)**

- Loading data from **DB, HTTP, or SDKs** (including `fetch`, ORM, Supabase
  clients, React Query/SWR setup with real IO).
- **Heavy** business rules, multi-step workflows, or non-trivial validation
  pipelines.
- **Complex client state** and side effects (`useState` trees, `useEffect` for
  sync/async work) — use a colocated or shared **hook**;
  `eslint-plugin-code-policy` enforces this via `view-logic-separation` where
  configured.

**Where “heavy” logic goes**

- **Client data and effects** → colocated `hooks/` under the component or shared
  `hooks/`, calling into `services/` for IO.
- **Server-only data** → Server Components, route handlers, or server actions
  (framework-specific), not inside presentation components.

- **`services/`** — All **external** boundaries: HTTP clients,
  Supabase/Firebase/OpenAI SDKs, analytics, auth providers, generated API
  clients. Each subfolder is a **bounded context** with its own `types`,
  `hooks`, `utils`.
- **Root `hooks/`, `types/`, `utils/`, `const/`** — **Shared** ownership only
  after reuse is proven (two or more call sites outside one feature folder).
- **`app/`** — Framework routing and server/client boundaries (Next.js App
  Router, etc.).

---

### 3. Code placement rules

| Kind               | Stay local when                               | Promote to shared when                                                                                    |
| ------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Type**           | Used by a single component/service folder     | Imported from 2+ features/components (or required for a public API)                                       |
| **Hook**           | State/effects specific to one component tree  | Reused across unrelated components or routes                                                              |
| **Util**           | Pure helper used once                         | Second stable consumer appears                                                                            |
| **Const**          | Strings/numbers only relevant to one UI slice | Same literal or config repeated across modules                                                            |
| **Service helper** | Mapping or guard private to one integration   | Another service or shared layer needs the same primitive                                                  |
| **Service type**   | DTO for one API surface                       | Becomes a **domain** or **app-wide** contract — move to root `types/` (or a `domain/` slice) deliberately |

**Service structure**

- **Belongs**: client factory, request/response mappers, error normalization,
  narrow hooks wrapping the provider, feature flags for that integration.
- **Does not belong**: generic UI formatting, unrelated domain rules, or
  arbitrary `utils` that are not integration-specific (those go to `utils/` or
  `lib/` after promotion).

---

### 4. Function responsibility model

- **Single-responsibility function** — Does **one** transform, one query
  assembly, one validation pass, or one render-oriented derivation with a name
  that matches that task.
- **Orchestrator** — Sequences **already extracted** steps (e.g. validate → call
  service → map result → return view-model). Contains **no** deep branching
  implementation of sub-steps; delegates to helpers/hooks/services.
- **Too much (must split)** — Multiple unrelated I/O concerns, mixed UI state +
  API + persistence, or a single function that scores high on **cyclomatic
  complexity** and **max-lines-per-function** together.

**Hooks**

- One hook file ≈ one cohesive behavior (`useSignInForm`,
  `useProductListQuery`). If a hook mixes unrelated concerns, split.
- **Limits (this baseline)**: `max-lines-per-function` **warn** at **50**
  meaningful lines (comments/blank lines skipped); relax only with a documented
  eslint disable on exceptional generated or wiring code.

**Utilities**

- One exported function per file (aligned with `code-policy/atomic-file` in this
  repo).

---

### 5. ESLint strategy

#### 1) Which rules enforce file length and function length?

- **File length**: ESLint core **`max-lines`**
- **Function length**: ESLint core **`max-lines-per-function`**

#### 2) How to implement “50 warning / 100 error”?

**Fact:** ESLint does **not** support two different severities for
**`max-lines`** on the **same** file in one pass. The flat config merge
semantics mean **one** `max-lines` entry wins per file.

**Practical approach in this repo**

- **`max-lines`**: **`error`** at **100** meaningful lines
  (`skipBlankLines: true`, `skipComments: true`). This is the enforceable
  refactor gate.
- **50-line “warning zone”**: Treat **50–100** lines as a **review and refactor
  signal**, not a second ESLint tier. Optional fallbacks if you must automate
  the soft band:
  - CI script counting lines (warn-only job), or
  - Editor ruler at 50, or
  - A **custom** ESLint rule (maintenance cost).

**Overrides** in `@vibracomet/eslint-config/code-quality`: config files and
tests relax or disable line limits; Next.js App Router special files use
**`warn`** at **120** lines so metadata-heavy routes are not blocked while still
surfacing smell.

#### 3) Complexity

- **Cyclomatic complexity**: ESLint core **`complexity`** — **warn**, max **10**
  (this baseline).
- **Nesting / arity**: **`max-depth`** (warn, 4), **`max-params`** (warn, 4).
- **Duplication**: **SonarJS** rules for identical functions/branches.

**Cognitive complexity** (Sonar concept) is **not** enabled by default here;
enable selectively if the team wants stricter signal.

#### 4) Thresholds summary

| Metric                   | Level | Value                           |
| ------------------------ | ----- | ------------------------------- |
| `max-lines`              | error | 100 (with documented overrides) |
| `max-lines-per-function` | warn  | 50                              |
| `complexity`             | warn  | 10                              |
| `max-depth`              | warn  | 4                               |
| `max-params`             | warn  | 4                               |

---

### 6. Boundaries and import rules

**eslint-plugin-boundaries** (see `createFrontendBoundariesConfig` in
`@vibracomet/eslint-config/frontend-boundaries`):

- **`app`** may import **components**, **shared**, **services**
- **`components`** may import **components**, **shared** — **not** `services`
  directly
- **`shared`** (hooks, types, utils, const, lib, store, …) may import **shared**
  and **services**
- **`services`** may import **services** and **shared** — **not** `components`

**Why** — UI stays free of provider SDK noise; hooks and services own I/O.
**Service internals** (submodules) should be consumed via each service’s
**public** surface (`index.ts`); `code-policy/public-api-imports` and review
back this up.

---

### 7. Anti-patterns to forbid

| Anti-pattern                                        | Detectable by ESLint?                         | Mitigation                                          |
| --------------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| TSX with heavy state/effects                        | **Yes** (`code-policy/view-logic-separation`) | Fix: move to hooks                                  |
| Multiple top-level exports in one file              | **Yes** (`code-policy/atomic-file`)           | Split files                                         |
| Components importing `services/**` directly         | **Yes** (`boundaries`)                        | Route through `hooks/` or a thin facade in `shared` |
| God `utils.ts` with many exports                    | **Yes** (atomic file + max-lines)             | One function per file                               |
| Copy-pasted functions / branches                    | **Yes** (SonarJS)                             | Extract shared helper                               |
| Inline types in implementation files                | **Yes** (`code-policy/no-inline-types`)       | Move to `types/`                                    |
| “Orchestrator” that implements all sub-steps inline | **Partially** (complexity + length)           | Review + split                                      |
| Heavy logic, IO, or DB access inside `.tsx`         | **Partially** (`view-logic-separation`)       | Move to hooks + `services/`; keep TSX thin          |

---

### 8. Migration plan

**Phase 1 — Tooling** — Add layered ESLint config: `base` → framework →
`code-quality` → `accessibility` (if UI). Turn on CI `eslint .` with fail on
error-level rules.

**Phase 2 — Boundaries** — Introduce `services/` and `frontend-boundaries`; fix
imports until `boundaries/element-types` is clean. Allow temporary
`eslint-disable` only with tickets.

**Phase 3 — Splitting** — Address `max-lines` and `atomic-file` violations by
feature slice; prefer vertical slices over big-bang rewrites.

**Phase 4 — Tighten** — Optionally flip selected warnings to errors
(`complexity`, `max-lines-per-function`) once noise is low.

---

### 9. Example config

Consumer `eslint.config.ts` (Next.js app using this monorepo’s packages):

```ts
import { createAccessibilityConfig } from '@vibracomet/eslint-config/accessibility'
import { createBaseConfig } from '@vibracomet/eslint-config/base'
import { createCodeQualityConfig } from '@vibracomet/eslint-config/code-quality'
import { createNextjsConfig } from '@vibracomet/eslint-config/nextjs'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
  ...createAccessibilityConfig(),
]
```

`createNextjsConfig`, `createViteReactConfig`, and `createAstroConfig` already
include `createFrontendBoundariesConfig()` for layered imports.

**Standalone boundaries** (e.g. custom stack):

```ts
import { createFrontendBoundariesConfig } from '@vibracomet/eslint-config/frontend-boundaries'

export default [...createFrontendBoundariesConfig()]
```

See also: `templates/nextjs-app/eslint.config.ts` and
`templates/astro-site/eslint.config.ts` in this repository.
