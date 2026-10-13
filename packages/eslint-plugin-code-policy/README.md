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

### Full stack baseline

This plugin ships **rules and one preset** only. For the full shared ESLint
baseline (TypeScript ESLint, imports, security, framework layers, and
`code-policy` wiring), use **`@syntopica/eslint-config`** from the same
repository (`packages/eslint-config`, its `PUBLIC_API.md`, and `docs/adoption/`
for migration steps).

The plugin does not configure a parser. To lint `.ts` and `.tsx` files on its
own, add `typescript-eslint`'s parser and a `files` pattern, or use
`@syntopica/eslint-config`, which does both.

---

## Usage

### Flat config (`eslint.config.mjs`)

```js
import codePolicy from 'eslint-plugin-code-policy'

export default [codePolicy.configs.recommended]
```

### Presets

`recommended` enables every rule below. `boundaries` enables only the three
import-boundary rules (`public-api-imports`, `no-cross-module-deep-imports`,
`no-mixed-barrel`), for projects that want module entry points enforced without
the atomic-file layout. `strict`, `react` and `next` are exported under their
own names but currently enable exactly the same rules at the same severities as
`recommended`. Next.js special files and reserved exports are handled by the
rules themselves, whichever preset you pick.

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
      'code-policy/no-mixed-barrel': 'error',
      'code-policy/view-logic-separation': 'warn',
    },
  },
]
```

---

## Rules

### `code-policy/one-primary-unit`

> **Forbid more than one top-level exported unit per file.**

A file that exports two or more top-level units (functions, classes, constants
or types) is reported. A file with no export is not reported by this rule, and a
class counts as one unit however many methods it has; pair it with
`no-hidden-top-level-declarations` and a size cap such as `max-lines` to bound
what a single unit can hold.

**Exemptions (automatically skipped)**

- `*.config.ts` / `*.config.js` / `*.config.mjs`
- `index.ts` / `index.tsx` / `index.js` (barrel files)
- Next.js special files: `page.tsx`, `layout.tsx`, `route.ts`, etc. — reserved
  exports like `GET`, `POST`, `metadata` are not counted.

---

### `code-policy/no-hidden-top-level-declarations`

> **Forbid internal module-scoped logic and helpers.**

Files cannot contain private/unexported top-level declarations that hide
complexity. If a helper is needed, it should be extracted to its own file and
imported explicitly.

---

### `code-policy/no-inline-types-in-runtime-files`

> **Enforce that type aliases and interfaces live in their own files.**

Type declarations that appear alongside implementation code create hidden
coupling and violate the single responsibility principle. Every `type` or
`interface` must be in a dedicated file, isolating runtime from type
declarations.

An anonymous object type written into runtime code is the same unit without a
name, so it is reported too: `const rows: { a: string }[]`,
`JSON.parse(text) as { version: string }`, a parameter or return annotation, or
a type argument such as `new Map<string, { count: number }>()`. Only the
outermost literal is reported. A literal inside a named type is that type's
body, and one inside `declare global` or `declare module` has no file to move
to.

**Exemptions**

- Files inside `types/` or `types/**` directories
- `*.d.ts` files
- "Pure type files" — files whose entire body consists only of `import` +
  `type`/`interface` declarations

---

### `code-policy/file-kind-placement`

> **Ensure files strictly follow kind-based naming and folder placement.**

Detects a file's kind from its name and requires the matching folder: `use*`
files belong in `hooks/`, `format*` and `*Formatter` in `formatters/`,
`validate*` and `*Validator` in `validators/`, `map*`, `*Mapper` and
`*Transformer` in `mappers/`, and `select*` and `*Selector` in `selectors/`.
PascalCase `.tsx`/`.jsx` components are exempt, and `utils/` and `helpers/`
folders are rejected unless `allowGenericFolders` is set. The check reads names
only; it does not verify what the code does.

**Options**

- `allowGenericFolders` (default `false`): permit `utils/` and `helpers/` at any
  depth as homes for pure helpers; files under such a folder are exempt from
  placement checks.
- `allowColocation` (default `false`): exempt a placement-checked unit (hook,
  mapper, formatter, validator, selector) when it is colocated with its consumer
  instead of orphaned in a purely technical folder. A folder counts as a
  colocation home when it holds an _anchor_ next to the unit: a public-API
  barrel (`index.*`), a component (`PascalCase.tsx`/`.jsx`), or any neighbouring
  code file that is not itself a placement-checked kind (the consumer). This
  matches modern feature-folder guidance — a single-consumer hook or util lives
  beside its consumer; only shared units graduate to a dedicated
  `hooks/`/`mappers/` folder. An orphaned unit with no anchor still flags.

```js
'code-policy/file-kind-placement': ['error', { allowGenericFolders: true, allowColocation: true }]
```

---

### `code-policy/public-api-imports`

> **Prevent importing directly from internal module subpaths.**

Reports a static, non-relative module edge (`import`, `export ... from`,
`export * from`, `import('literal')`) whose path contains one of the configured
`bannedSubpaths` (default `/src/`) and none of the `allowedSubpaths`. It is a
pattern check: it does not resolve the import or know what a package actually
exports, so an internal path that does not contain a banned substring passes.

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

| Option            | Type       | Default     | Description                                            |
| ----------------- | ---------- | ----------- | ------------------------------------------------------ |
| `bannedSubpaths`  | `string[]` | `['/src/']` | Segments that signal a deep internal import            |
| `allowedSubpaths` | `string[]` | `[]`        | Segments a package deliberately exposes; never flagged |

---

### `code-policy/no-cross-module-deep-imports`

> **Prevent relative imports that bypass another module's public API within a
> monorepo.**

In a monorepo, relative paths like `../../core/src/utils/helper` skip the `core`
module's public API entirely. This rule detects that pattern in static relative
module edges (imports, re-exports and literal dynamic imports) by counting `../`
traversal depth and checking for internal directory names in the descent. It
does not resolve paths.

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

### `code-policy/no-mixed-barrel`

> **Forbid `index.*` files that mix re-exports with inline declarations.**

An `index.ts`, `index.tsx` or `index.js` that re-exports from other modules must
not also declare and export its own code. Keep the barrel a pure list of
re-exports, or move the declarations to their own files. An index file without
re-exports is not checked.

---

### `code-policy/view-logic-separation`

> **Prevent state, effects, and inline handlers inside React view components.**

React view components (`.tsx` files) are responsible for rendering only. State
management, side effects, and event handler logic must live in a dedicated
custom hook. This enforces a clean view/controller split.

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

This rule is a `warn` in `recommended`; run ESLint with `--max-warnings 0` if
warnings should fail the gate.

**What triggers this rule (inside `.tsx` files)**

- Calling React hooks, directly or as `React.useState`: `useState`, `useEffect`,
  `useReducer`, `useCallback`, `useMemo`, `useRef`, and more
- Declaring named functions/handlers directly inside a view component body

A view is a module-scope function, or one passed to a module-scope `memo` or
`forwardRef`. A function named `useXxx` is a custom hook and is not checked,
even in a `.tsx` file. Arrow functions written inline in JSX attributes are not
reported.

---

## Shareable Configs Reference

### `recommended`

Enables eight rules. Best starting point for any TypeScript project.

```js
'code-policy/one-primary-unit': 'error'
'code-policy/no-hidden-top-level-declarations': 'error'
'code-policy/no-inline-types-in-runtime-files': 'error'
'code-policy/file-kind-placement': 'error'
'code-policy/public-api-imports': 'error'
'code-policy/no-cross-module-deep-imports': 'error'
'code-policy/no-mixed-barrel': 'error'
'code-policy/view-logic-separation': 'warn'
```

The deprecated `atomic-file` and `no-inline-types` rules are still registered
for compatibility and are off.

### `strict`, `react`, `next`

Aliases of `recommended` with the same rule map, kept so that configs naming
them keep working. They are reserved for future stack-specific adjustments.

---

## Migrating from Legacy Config

This plugin only supports the **ESLint flat config** format (ESLint v9+). If
you're still on the legacy `.eslintrc` format, migrate using the
[official ESLint migration guide](https://eslint.org/docs/latest/use/configure/migration-guide)
before installing this plugin.

---

## FAQ

**Q: Why do I get errors on my `index.ts` barrel files?**

`index.ts` files are automatically exempted from the primary unit rules because
barrel files by design re-export multiple things.

**Q: How do I exempt a specific file from a rule?**

Use ESLint's standard inline disable comment:

```ts
// eslint-disable-next-line code-policy/one-primary-unit -- reason
```

Or add file overrides in your `eslint.config.mjs`:

```js
{
  files: ['src/legacy/**'],
  rules: {
    'code-policy/one-primary-unit': 'off',
  },
}
```

**Q: Does this work with JavaScript (non-TypeScript) projects?**

The rules are language-agnostic at the ESLint AST level. TypeScript-specific
nodes are handled gracefully. You can use the plugin on `.js` files, though some
rules (like `no-inline-types-in-runtime-files`) are most meaningful in
TypeScript codebases.

---

## License

[MIT](../../LICENSE)
