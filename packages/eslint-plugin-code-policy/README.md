<div align="center">

<h1>eslint-plugin-code-policy</h1>

<p><strong>Architectural linting for TypeScript · React · Next.js</strong></p>

[![npm version](https://img.shields.io/npm/v/eslint-plugin-code-policy?color=2563eb&label=npm&style=flat-square)](https://www.npmjs.com/package/eslint-plugin-code-policy)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](../../LICENSE)
[![ESLint Flat Config](https://img.shields.io/badge/ESLint-v9%2Fv10%20flat%20config-8b5cf6?style=flat-square)](https://eslint.org/docs/latest/use/configure/configuration-files)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-3b82f6?style=flat-square)](https://www.typescriptlang.org/)

</div>

---

## Installation

**Requirements**

- ESLint `>=9.0.0` (flat config, including v10)
- TypeScript `^5.4.0`
- Node.js `>=20.19`

```bash
# npm
npm install --save-dev eslint-plugin-code-policy

# pnpm
pnpm add --save-dev eslint-plugin-code-policy

# yarn
yarn add --dev eslint-plugin-code-policy
```

### Full stack baseline (recommended for VibraComet projects)

This plugin ships **rules and small presets** only. For the full shared ESLint baseline (TypeScript ESLint, imports, security, framework layers, and optional `code-policy` wiring), use the published config package:

- **`@vibracomet/eslint-config`** — published from the `engineering-baseline` repository (`packages/eslint-config`, `PUBLIC_API.md`, and `docs/adoption/` for migration steps).

Install it alongside this plugin when you want parity with the monorepo templates.

---

## Usage

### Flat config (`eslint.config.mjs`)

```js
import codePolicy from 'eslint-plugin-code-policy'

export default [codePolicy.configs.recommended]
```

### Choosing a preset

| Preset        | Import path                      | Best for               |
| ------------- | -------------------------------- | ---------------------- |
| `recommended` | `codePolicy.configs.recommended` | Any TypeScript project |
| `strict`      | `codePolicy.configs.strict`      | Maximum enforcement    |
| `react`       | `codePolicy.configs.react`       | React (Vite, CRA, …)   |
| `next`        | `codePolicy.configs.next`        | Next.js App Router     |

```js
// Next.js example
import codePolicy from 'eslint-plugin-code-policy'

export default [codePolicy.configs.next]
```

### Manual rule configuration

If you prefer to cherry-pick rules:

```js
import codePolicy from 'eslint-plugin-code-policy'

export default [
  {
    plugins: { 'code-policy': codePolicy },
    rules: {
      'code-policy/one-primary-unit': 'error',
      'code-policy/no-hidden-top-level-declarations': 'error',
      'code-policy/no-inline-types-in-runtime-files': 'error',
      'code-policy/file-kind-placement': 'error',
      'code-policy/public-api-imports': 'error',
      'code-policy/no-cross-module-deep-imports': 'error',
      'code-policy/view-logic-separation': 'error',
    },
  },
]
```

---

## Rules

### `code-policy/one-primary-unit`

> **Enforce exactly one top-level exported declaration per file.**

Each file must export exactly one top-level unit — a function, class, constant, or type. This focuses the identity of every module.

**Exemptions (automatically skipped)**

- `*.config.ts` / `*.config.js` / `*.config.mjs`
- `index.ts` / `index.tsx` / `index.js` (barrel files)
- Next.js special files: `page.tsx`, `layout.tsx`, `route.ts`, etc. — reserved exports like `GET`, `POST`, `metadata` are not counted.

---

### `code-policy/no-hidden-top-level-declarations`

> **Forbid internal module-scoped logic and helpers.**

Files cannot contain private/unexported top-level declarations that hide complexity. If a helper is needed, it should be extracted to its own file and imported explicitly.

---

### `code-policy/no-inline-types-in-runtime-files`

> **Enforce that type aliases and interfaces live in their own files.**

Type declarations that appear alongside implementation code create hidden coupling and violate the single responsibility principle. Every `type` or `interface` must be in a dedicated file, isolating runtime from type declarations.

**Exemptions**

- Files inside `types/` or `types/**` directories
- `*.d.ts` files
- "Pure type files" — files whose entire body consists only of `import` + `type`/`interface` declarations

---

### `code-policy/file-kind-placement`

> **Ensure files strictly follow kind-based naming and folder placement.**

Ensures types are placed in `types/`, contexts in `contexts/`, and hooks start with `use`. Strict architectural adherence is enforced at a structural level.

---

### `code-policy/public-api-imports`

> **Prevent importing directly from internal module subpaths.**

When consuming a package or module, you must import from its public API (the root / index), not from a deep internal path. Deep imports couple you to internal implementation details.

**❌ Incorrect**

```ts
// ❌ Bypassing the public API
import { Button } from '@myorg/ui/src/components/Button'
import { formatDate } from '@myorg/utils/src/date/formatDate'
```

**✅ Correct**

```ts
// ✅ Always import through the public surface
import { Button } from '@myorg/ui'
import { formatDate } from '@myorg/utils'
```

**Options**

```js
{
  'code-policy/public-api-imports': ['error', {
    bannedSubpaths: ['/src/'] // default
  }]
}
```

| Option           | Type       | Default     | Description                                 |
| ---------------- | ---------- | ----------- | ------------------------------------------- |
| `bannedSubpaths` | `string[]` | `['/src/']` | Segments that signal a deep internal import |

---

### `code-policy/no-cross-module-deep-imports`

> **Prevent relative imports that bypass another module's public API within a monorepo.**

In a monorepo, relative paths like `../../core/src/utils/helper` skip the `core` module's public API entirely. This rule detects that pattern by counting `../` traversal depth and checking for internal directory names in the descent.

**❌ Incorrect**

```ts
// ❌ packages/ui/src/Button.tsx
import { helper } from '../../core/src/utils/helper'
```

**✅ Correct**

```ts
// ✅ Import through the published public API
import { helper } from '@myorg/core'
```

**Options**

```js
{
  'code-policy/no-cross-module-deep-imports': ['error', {
    minParentTraversals: 2,   // how many `../` levels before checking
    internalDirs: ['src']     // dirs that signal internal code
  }]
}
```

| Option                | Type       | Default   | Description                                      |
| --------------------- | ---------- | --------- | ------------------------------------------------ |
| `minParentTraversals` | `number`   | `2`       | Minimum `../` segments before the rule activates |
| `internalDirs`        | `string[]` | `['src']` | Directory names that indicate internal code      |

---

### `code-policy/view-logic-separation`

> **Prevent state, effects, and inline handlers inside React view components.**

React view components (`.tsx` files) are responsible for rendering only. State management, side effects, and event handler logic must live in a dedicated custom hook. This enforces a clean view/controller split.

**❌ Incorrect**

```tsx
// ❌ src/UserCard.tsx — logic inside a view
export function UserCard({ userId }: UserCardProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])

  const handleDelete = () => {
    deleteUser(userId)
  }

  return <div onClick={handleDelete}>{user?.name}</div>
}
```

**✅ Correct**

```ts
// ✅ src/useUserCard.ts
export function useUserCard(userId: string) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])

  const handleDelete = () => deleteUser(userId)

  return { user, handleDelete }
}
```

```tsx
// ✅ src/UserCard.tsx — pure view
import { useUserCard } from './useUserCard'

export function UserCard({ userId }: UserCardProps) {
  const { user, handleDelete } = useUserCard(userId)
  return <div onClick={handleDelete}>{user?.name}</div>
}
```

**What triggers this rule (inside `.tsx` files)**

- Calling React hooks: `useState`, `useEffect`, `useReducer`, `useCallback`, `useMemo`, `useRef`, and more
- Declaring inline functions/handlers directly inside a view component body

---

## Shareable Configs Reference

### `recommended`

Enables all five rules as errors. Best starting point for any TypeScript project.

```js
// Rules enabled:
'code-policy/one-primary-unit': 'error'
'code-policy/no-hidden-top-level-declarations': 'error'
'code-policy/no-inline-types-in-runtime-files': 'error'
'code-policy/file-kind-placement': 'error'
'code-policy/view-logic-separation': 'error'
'code-policy/public-api-imports': 'error'
'code-policy/no-cross-module-deep-imports': 'error'
```

### `strict`

Extends `recommended`. Intended for projects that want zero tolerance for architectural deviation. Reserved for additional strictness overrides in future versions.

### `react`

Extends `recommended` with React-specific adjustments.

### `next`

Extends `recommended`. Correctly handles Next.js App Router special files (`page.tsx`, `layout.tsx`, `route.ts`, etc.) and reserved exports (`metadata`, `GET`, `POST`, …), preventing false positives.

---

## Migrating from Legacy Config

This plugin only supports the **ESLint flat config** format (ESLint v9+). If you're still on the legacy `.eslintrc` format, migrate using the [official ESLint migration guide](https://eslint.org/docs/latest/use/configure/migration-guide) before installing this plugin.

---

## FAQ

**Q: Why do I get errors on my `index.ts` barrel files?**

`index.ts` files are automatically exempted from the primary unit rules because barrel files by design re-export multiple things.

**Q: How do I exempt a specific file from a rule?**

Use ESLint's standard inline disable comment:

```ts
// eslint-disable-next-line code-policy/atomic-file
```

Or add file overrides in your `eslint.config.mjs`:

```js
{
  files: ['src/legacy/**'],
  rules: {
    'code-policy/atomic-file': 'off',
  },
}
```

**Q: Does this work with JavaScript (non-TypeScript) projects?**

The rules are language-agnostic at the ESLint AST level. TypeScript-specific nodes are handled gracefully. You can use the plugin on `.js` files, though some rules (like `no-inline-types`) are most meaningful in TypeScript codebases.

---

## License

[MIT](../../LICENSE)
