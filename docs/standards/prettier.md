# Prettier Standard

## Canonical config

```js
// @repo/prettier-config/base.mjs
export default {
  trailingComma: "all",
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  printWidth: 100,
};
```

These values are non-negotiable in new projects. Do not override them per-project.

## Which preset to use

| Project type               | Import                           |
| -------------------------- | -------------------------------- |
| Node / tooling / no CSS    | `@repo/prettier-config` (base)   |
| Any frontend with Tailwind | `@repo/prettier-config/frontend` |
| Astro site                 | `@repo/prettier-config/astro`    |

## Forbidden plugins

- `prettier-plugin-organize-imports` — import ordering is not Prettier's responsibility. It causes hidden code motion and conflicts with ESLint import rules. Do not add it.
- `prettier-plugin-css-order` — not in the shared base. Add locally only if justified and documented.

## Integration with ESLint

`eslint-config-prettier` is always the last entry in every ESLint config. This disables all ESLint rules that would conflict with Prettier. Never add `prettier/prettier` as an ESLint rule — that pattern is deprecated.

## Mandatory scripts

Every project must expose:

```jsonc
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
  },
}
```

`format:check` must be part of `check:ci`.
