# Code Quality Standard

## The problem this solves

AI-assisted development creates a recurring pattern of quality debt:

- Everything ends up in one file
- Types defined inline alongside components
- Business logic entangled inside TSX view components
- Duplicated code blocks spread across the codebase
- Functions that do too many things at once

The code-quality layer enforces the opposite: many small, focused, reusable
files, each doing one thing.

## Activation

Add the third layer to any project's `eslint.config.ts`:

```ts
import { createBaseConfig } from '@vibracomet/eslint-config/base'
import { createCodeQualityConfig } from '@vibracomet/eslint-config/code-quality'
import { createNextjsConfig } from '@vibracomet/eslint-config/nextjs'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
]
```

For the full architecture narrative (folders, orchestrators, boundaries,
migration), see
[typescript-frontend-architecture.md](./typescript-frontend-architecture.md).

Add the required devDependencies:

```json
{
  "eslint-plugin-code-policy": "^0.2.1",
  "eslint-plugin-sonarjs": "^3.0.0"
}
```

## Rules

### `code-policy/atomic-file` — one declaration per file (error)

Each file exports exactly one top-level declaration. This is the primary driver
of the "millions of small reusable files" architecture.

**Wrong:**

```ts
// utils/format.ts — two exports in one file
export function formatDate(d: Date) { ... }
export function formatCurrency(n: number) { ... }
```

**Right:**

```ts
// utils/format-date.ts
export function formatDate(d: Date) { ... }

// utils/format-currency.ts
export function formatCurrency(n: number) { ... }
```

**Automatic exemptions:** `index.*` barrel files, config files (`*.config.*`,
`*.setup.*`), Next.js routing files (`page.tsx`, `layout.tsx`, `loading.tsx`,
`error.tsx`, `route.ts`), and entry-point bootstraps (`main.tsx`, `main.ts` —
disabled via override in `eslint.config.ts`).

---

### `code-policy/no-inline-types` — types in dedicated files (error)

`interface` and `type` alias declarations must live in dedicated type files, not
alongside the code that uses them.

**Wrong:**

```ts
// components/UserCard.tsx
type UserCardProps = { name: string; avatar: string }

export function UserCard({ name, avatar }: UserCardProps) { ... }
```

**Right:**

```ts
// types/user-card-props.ts
export type UserCardProps = { name: string; avatar: string }

// components/UserCard.tsx
import type { UserCardProps } from '../types/user-card-props'
export function UserCard({ name, avatar }: UserCardProps) { ... }
```

**Exception:** Simple one-off inline object types in function signatures are
allowed (e.g., `{ children: ReactNode }`) because they don't define a named,
reusable contract.

---

### `code-policy/view-logic-separation` — no logic in TSX views (error)

`.tsx` view components must not contain state management, side effects, or
handler logic. These belong in custom hooks.

**Presentation-only contract (team standard):** TSX should focus on **what is
shown** and **small, local presentation concerns** — for example class names,
layout spacing, deriving a display color from props, or a one-line label from a
flag. **Heavy logic** (DB access, API/SDK calls, multi-step rules, non-trivial
async) must live in **hooks** plus **`services/`** (or server-only modules), not
in the TSX file. See
[typescript-frontend-architecture.md](./typescript-frontend-architecture.md#tsx-presentation-contract).

**Wrong:**

```tsx
// components/SearchBar.tsx
export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    fetch(`/api/search?q=${query}`)
      .then((r) => r.json())
      .then(setResults)
  }, [query])

  const handleClear = () => setQuery('')

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

**Right:**

```ts
// hooks/useSearch.ts
export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    fetch(`/api/search?q=${query}`)
      .then((r) => r.json())
      .then(setResults)
  }, [query])

  return { query, setQuery, results }
}
```

```tsx
// components/SearchBar.tsx
import { useSearch } from '../hooks/useSearch'

export function SearchBar() {
  const { query, setQuery } = useSearch()
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

---

### `code-policy/no-cross-module-deep-imports` — no deep internal imports (error)

Import from a module's public API (`index.ts`), never from its internal file
paths.

**Wrong:**

```ts
import { formatDate } from '@/features/billing/utils/format-date'
```

**Right:**

```ts
import { formatDate } from '@/features/billing'
```

---

### Complexity and size limits

| Rule                     | Severity  | Limit                    | What it catches                                               |
| ------------------------ | --------- | ------------------------ | ------------------------------------------------------------- |
| `max-lines`              | **error** | **100** meaningful lines | Files that should be split (`skipBlankLines`, `skipComments`) |
| `max-lines-per-function` | **warn**  | **50** meaningful lines  | Functions that should be split or delegated                   |
| `complexity`             | warn      | 10                       | Too many branching paths                                      |
| `max-depth`              | warn      | 4                        | Deeply nested logic                                           |
| `max-params`             | warn      | 4                        | Functions needing an options object instead                   |

**Note on “50 vs 100”:** ESLint applies one `max-lines` policy per file. This
baseline uses a **hard error at 100** lines. The **50-line** band is a
**team/review** signal (see architecture doc); it is not a second ESLint
severity on the same rule.

Overrides apply to `*.config.*`, test files, and Next.js App Router special
files (see
[`code-quality.ts` in eslint-config](https://github.com/VibraComet/eslint-config/blob/main/src/code-quality.ts)).

Warnings do not block CI unless your pipeline treats warnings as errors. Errors
(`max-lines`, code-policy, boundaries) block by default.

---

### `sonarjs/no-identical-functions` — duplicated function bodies (error)

Two functions with the same implementation must be merged or generalised.

### `sonarjs/no-duplicated-branches` — duplicated conditional branches (error)

```ts
// Wrong — both branches do the same thing
if (isAdmin) {
  return processRequest(req)
} else {
  return processRequest(req)
}
```

### `sonarjs/no-duplicate-string` — repeated string literals (warn, threshold: 4)

A string appearing 4+ times should be extracted to a constant.

---

## Folder conventions enforced by these rules

```
src/
  components/       # UI composition; colocated types/hooks/utils/const per component
  hooks/            # Shared hooks only after reuse is proven
  types/            # Shared types only after reuse is proven
  utils/            # Pure functions, one per file
  const/            # Shared constants (or constants/ — match project convention)
  services/         # External integrations (SDKs, APIs), bounded per provider
  store/            # Global client state (optional)
```

Layered imports (`components` → `shared` only; `shared` → `services`) are
enforced by `@vibracomet/eslint-config/frontend-boundaries` when you use
`createNextjsConfig`, `createViteReactConfig`, or `createAstroConfig`. See
[typescript-frontend-architecture.md](./typescript-frontend-architecture.md).

Each file in `components/` should be readable without understanding integration
details. Each file in `hooks/` should be testable without rendering anything.

## Tuning

To adjust a limit for a specific file or block, use inline comments:

```ts
// eslint-disable-next-line max-lines-per-function -- generated parser, not hand-maintained
export function parseComplexSchema(input: unknown) { ... }
```

To permanently adjust a project-wide threshold, extend the config in your local
`eslint.config.ts`:

```ts
export default [
  ...createCodeQualityConfig(),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['warn', { max: 200 }], // justified: domain is inherently verbose
    },
  },
]
```

Never disable `code-policy/view-logic-separation` or `code-policy/atomic-file`
project-wide — these are the load-bearing rules.
