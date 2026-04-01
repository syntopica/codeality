# Code Quality Standard

## The problem this solves

AI-assisted development creates a recurring pattern of quality debt:

- Everything ends up in one file
- Types defined inline alongside components
- Business logic entangled inside TSX view components
- Duplicated code blocks spread across the codebase
- Functions that do too many things at once

The code-quality layer enforces the opposite: many small, focused, reusable files, each doing one thing.

## Activation

Add the third layer to any project's `eslint.config.ts`:

```ts
import { createBaseConfig } from "@repo/eslint-config/base";
import { createCodeQualityConfig } from "@repo/eslint-config/code-quality";
import { createNextjsConfig } from "@repo/eslint-config/nextjs";

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
];
```

Add the required devDependencies:

```json
{
  "eslint-plugin-code-policy": "^0.2.1",
  "eslint-plugin-sonarjs": "^3.0.0"
}
```

## Rules

### `code-policy/atomic-file` — one declaration per file (error)

Each file exports exactly one top-level declaration. This is the primary driver of the "millions of small reusable files" architecture.

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

**Automatic exemptions:** `index.*` barrel files, config files (`*.config.*`, `*.setup.*`), Next.js routing files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`), and entry-point bootstraps (`main.tsx`, `main.ts` — disabled via override in `eslint.config.ts`).

---

### `code-policy/no-inline-types` — types in dedicated files (error)

`interface` and `type` alias declarations must live in dedicated type files, not alongside the code that uses them.

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

**Exception:** Simple one-off inline object types in function signatures are allowed (e.g., `{ children: ReactNode }`) because they don't define a named, reusable contract.

---

### `code-policy/view-logic-separation` — no logic in TSX views (error)

`.tsx` view components must not contain state management, side effects, or handler logic. These belong in custom hooks.

**Wrong:**

```tsx
// components/SearchBar.tsx
export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch(`/api/search?q=${query}`)
      .then((r) => r.json())
      .then(setResults);
  }, [query]);

  const handleClear = () => setQuery("");

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

**Right:**

```ts
// hooks/useSearch.ts
export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch(`/api/search?q=${query}`)
      .then((r) => r.json())
      .then(setResults);
  }, [query]);

  return { query, setQuery, results };
}
```

```tsx
// components/SearchBar.tsx
import { useSearch } from "../hooks/useSearch";

export function SearchBar() {
  const { query, setQuery } = useSearch();
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

### `code-policy/no-cross-module-deep-imports` — no deep internal imports (error)

Import from a module's public API (`index.ts`), never from its internal file paths.

**Wrong:**

```ts
import { formatDate } from "@/features/billing/utils/format-date";
```

**Right:**

```ts
import { formatDate } from "@/features/billing";
```

---

### Complexity limits (warn)

These warn before a function becomes unmaintainable:

| Rule                     | Limit | What it catches                             |
| ------------------------ | ----- | ------------------------------------------- |
| `max-lines`              | 150   | Files that are doing too much               |
| `max-lines-per-function` | 40    | Functions with too many responsibilities    |
| `complexity`             | 10    | Too many branching paths                    |
| `max-depth`              | 4     | Deeply nested logic                         |
| `max-params`             | 4     | Functions needing an options object instead |

Warnings don't block CI but appear in editor. When you hit a limit, the correct fix is extraction, not bumping the limit.

---

### `sonarjs/no-identical-functions` — duplicated function bodies (error)

Two functions with the same implementation must be merged or generalised.

### `sonarjs/no-duplicated-branches` — duplicated conditional branches (error)

```ts
// Wrong — both branches do the same thing
if (isAdmin) {
  return processRequest(req);
} else {
  return processRequest(req);
}
```

### `sonarjs/no-duplicate-string` — repeated string literals (warn, threshold: 4)

A string appearing 4+ times should be extracted to a constant.

---

## Folder conventions enforced by these rules

```
src/
  components/       # Pure view files only (.tsx)
  hooks/            # All state and side-effect logic
  types/            # All interface and type alias declarations
  utils/            # Pure functions, one per file
  services/         # API calls and external integrations
  stores/           # Global state (Zustand, Jotai, etc.)
  constants/        # Shared string/number constants
```

Each file in `components/` should be readable without understanding the business logic. Each file in `hooks/` should be testable without rendering anything.

## Tuning

To adjust a limit for a specific file or block, use inline comments:

```ts
// eslint-disable-next-line max-lines-per-function -- generated parser, not hand-maintained
export function parseComplexSchema(input: unknown) { ... }
```

To permanently adjust a project-wide threshold, extend the config in your local `eslint.config.ts`:

```ts
export default [
  ...createCodeQualityConfig(),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["warn", { max: 200 }], // justified: domain is inherently verbose
    },
  },
];
```

Never disable `code-policy/view-logic-separation` or `code-policy/atomic-file` project-wide — these are the load-bearing rules.
