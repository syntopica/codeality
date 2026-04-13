# Prettier Standard

## Canonical config

The shared package `@busirocket/prettier-config` encodes non-negotiable
formatting and the plugin stack used across this portfolio.

### Base (`@busirocket/prettier-config`)

- **Formatting:** `trailingComma: "all"`, `tabWidth: 2`, `useTabs: false`,
  `semi: false`, `singleQuote: true`, `printWidth: 100`.
- **Plugins:** `prettier-plugin-organize-imports`, `prettier-plugin-css-order`
  (same order as in the published config).
- **Overrides:** `*.md` uses `proseWrap: "always"` for readable docs and
  READMEs.

Do not override the core formatting keys in new projects unless there is a
documented exception (e.g. generated code, Liquid, legacy PHP).

### Frontend (`@busirocket/prettier-config/frontend`)

Everything in base, plus `prettier-plugin-tailwindcss` **last** (required by
that plugin).

### Astro (`@busirocket/prettier-config/astro`)

Base plugins, then `prettier-plugin-astro`, then `prettier-plugin-tailwindcss`
last. Includes an override so `*.astro` uses the `astro` parser.

## Which preset to use

| Project type                 | Import                                 |
| ---------------------------- | -------------------------------------- |
| Node / tooling / no Tailwind | `@busirocket/prettier-config` (base)   |
| Frontend with Tailwind       | `@busirocket/prettier-config/frontend` |
| Astro + Tailwind             | `@busirocket/prettier-config/astro`    |

## Peer dependencies

Install the plugins that match your preset (see
`@busirocket/prettier-config/package.json` `peerDependencies`). Base requires
Prettier plus `prettier-plugin-organize-imports` and
`prettier-plugin-css-order`. Frontend and Astro add Tailwind and Astro plugins
respectively.

## Optional local options

If class sorting or Tailwind resolution misbehaves in a monorepo, you may set
`tailwindConfig` to the path of your `tailwind.config.*` in the project
`prettier.config.mjs` after spreading the preset (same pattern as older
projects).

## Integration with ESLint

`eslint-config-prettier` is always the last entry in every ESLint config. Never
add `prettier/prettier` as an ESLint rule.

Import order is handled by `prettier-plugin-organize-imports` in the shared
Prettier preset. Do not add ESLint rules that auto-fix import order in a way
that fights Prettier on save (e.g. duplicate sort fixes). Keep ESLint focused on
correctness (cycles, duplicates, unused imports) per `docs/standards/eslint.md`.

## Mandatory scripts

Every project must expose:

```jsonc
{
  "scripts": {
    "format": "prettier --write . --list-different",
    "format:check": "prettier --check .",
  },
}
```

Always pass `--list-different` with `prettier --write` so the output lists files
that were reformatted.

`format:check` must be part of `check:ci`.
