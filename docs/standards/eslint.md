# ESLint Standard

## Mandatory decisions

- **Flat config only.** No `.eslintrc.*` files. No `FlatCompat`. Migration is a hard requirement before a project can consume shared configs.
- **Type-aware linting is enabled.** Shared configs must receive the consumer project's `tsconfigRootDir`. Do not hardcode the shared package directory.
- **Prettier handles formatting.** `eslint-config-prettier` is always the last entry. No stylistic lint rules. No `prettier/prettier` enforcement via ESLint.
- **Import hygiene lives in ESLint.** `prettier-plugin-organize-imports` must not be used. Import sorting is not enforced — only correctness (no cycles, no duplicates, no self-imports).

## Layer model

Configs compose left to right. Each layer can only add rules, not loosen them.

```text
base → framework extension → local architecture rules
```

### `@repo/eslint-config/base`

Generic JS/TS correctness. No framework knowledge. Contains:

- `@eslint/js` recommended
- `typescript-eslint` strict type-aware rules
- `eslint-plugin-import` — hygiene rules only
- `eslint-plugin-unused-imports` — hard fail on unused imports
- `eslint-config-prettier` last

### `@repo/eslint-config/nextjs`

Adds official `eslint-config-next` flat configs and architecture boundary governance defaults.

### `@repo/eslint-config/astro`

Adds `eslint-plugin-astro`, `.astro` parser setup, Astro-specific correctness rules, and Astro boundary map.

### `@repo/eslint-config/vite-react`

Adds `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` only.

### `@repo/eslint-config/node`

Adds Node.js globals and enforces `unicorn/prefer-node-protocol`.

## Factory usage

Shared ESLint configs are exported as factories so they resolve relative to the consumer project:

```ts
import { createBaseConfig } from "@repo/eslint-config/base";
import { createNextjsConfig } from "@repo/eslint-config/nextjs";

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
];
```

## Adding project-specific architecture rules

Create `eslint.architecture.ts` in your project root and spread it as the third layer.

## What is forbidden

- `.eslintrc.*` files
- `FlatCompat` in new projects
- `prettier/prettier` ESLint rule
- `prettier-plugin-organize-imports`
- Stylistic rules that duplicate Prettier behaviour
- Adding `eslint-plugin-boundaries` rules directly to the shared base
- Mixing framework rules into `base.ts`
