# ESLint Standard

## Mandatory decisions

- **Flat config only.** No `.eslintrc.*` files. No `FlatCompat`. Migration is a
  hard requirement before a project can consume shared configs.
- **Type-aware linting is enabled.** Shared configs must receive the consumer
  project's `tsconfigRootDir`. Do not hardcode the shared package directory.
- **Prettier handles formatting.** `eslint-config-prettier` is always the last
  entry. No stylistic lint rules. No `prettier/prettier` enforcement via ESLint.
- **Import hygiene.** Shared Prettier includes
  `prettier-plugin-organize-imports` for sort-on-format. ESLint enforces
  correctness only: no cycles, no duplicates, no self-imports
  (`eslint-plugin-import`), plus unused-import removal — not a second competing
  import-order fixer.

## Layer model

Configs compose left to right. Each layer can only add rules, not loosen them.

```text
base → framework extension → local architecture rules
```

### `@repo/eslint-config/base`

Generic JS/TS correctness. No framework knowledge. Contains:

- `@eslint/js` recommended
- `typescript-eslint` strict type-aware rules + consistency
  (`consistent-type-definitions: type`, `prefer-readonly`)
- `eslint-plugin-import` — hygiene rules only (no cycles, no duplicates, no
  self-imports)
- `eslint-plugin-unused-imports` — hard fail on unused imports
- `eslint-plugin-promise` — prefer async/await over `.then()`, no nested
  promises, param naming
- `eslint-plugin-security` — bans `eval()`, detects ReDoS-prone RegExp, path
  traversal, timing attacks
- `eslint-config-prettier` last

### `@repo/eslint-config/nextjs`

Adds `@next/eslint-plugin-next` core-web-vitals rules, full
`eslint-plugin-react` correctness rules (leaked render, unstable nested
components, no danger, self-closing), `eslint-plugin-react-hooks`, and
`eslint-plugin-boundaries` architecture map.

### `@repo/eslint-config/vite-react`

Adds full `eslint-plugin-react` correctness rules, `eslint-plugin-react-hooks`,
and `eslint-plugin-react-refresh`.

### `@repo/eslint-config/astro`

Adds `eslint-plugin-astro`, `.astro` parser setup, Astro-specific correctness
rules, and Astro boundary map.

### `@repo/eslint-config/node`

Adds Node.js globals and enforces `unicorn/prefer-node-protocol`.

### `@repo/eslint-config/code-quality`

Structural enforcement layer — see [code-quality.md](./code-quality.md).

### `@repo/eslint-config/accessibility`

WCAG 2.1 AA enforcement via `eslint-plugin-jsx-a11y` — see
[accessibility.md](./accessibility.md).

### `@repo/eslint-config/tailwind`

Tailwind CSS class ordering, contradiction detection, and shorthand enforcement
via `eslint-plugin-tailwindcss`. Only add to projects that use Tailwind CSS.

## Factory usage

Shared ESLint configs are exported as factories so they resolve relative to the
consumer project:

```ts
import { createBaseConfig } from '@repo/eslint-config/base'
import { createNextjsConfig } from '@repo/eslint-config/nextjs'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
]
```

## Adding project-specific architecture rules

Create `eslint.architecture.ts` in your project root and spread it as the third
layer.

## What is forbidden

- `.eslintrc.*` files
- `FlatCompat` in new projects
- `prettier/prettier` ESLint rule
- Stylistic rules that duplicate Prettier behaviour
- Adding `eslint-plugin-boundaries` rules directly to the shared base
- Mixing framework rules into `base.ts`
