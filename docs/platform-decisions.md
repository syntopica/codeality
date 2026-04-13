# Platform decisions (baseline packages)

This document records the executable decisions for publishing
`@busirocket/eslint-config`, `@busirocket/prettier-config`, and
`@busirocket/tsconfig`. It is the counterpart to internal engineering standards
under `docs/standards/`.

## Criterion (executive)

**Stabilize the public surface first; automate adoption second.**

Publishing the three config packages and documenting manual adoption takes
priority over a perfect CLI. The CLI (`@busirocket/create-baseline`) follows
once the API and dependency model are stable.

## Decision 1 — Plugin stays narrow

`eslint-plugin-code-policy` (separate repository) ships **custom rules and
minimal presets only**. It does **not** ship the full ESLint ecosystem. The full
baseline is composed in `@busirocket/eslint-config`.

## Decision 2 — Official config entry point

`@busirocket/eslint-config` is the **official** entry point for the shared
ESLint baseline (flat config). It composes core plugins, TypeScript ESLint,
import hygiene, optional framework plugins, and `eslint-plugin-code-policy`
where enabled.

## Decision 3 — Dedicated bootstrap

`@busirocket/create-baseline` is the dedicated CLI for install, wiring, and
migration. It is versioned independently and must not block the first npm
release of the config packages.

## Decision 4 — Hybrid dependencies

`@busirocket/eslint-config` uses:

- **`dependencies`:** core stack shipped with the package — `@eslint/js`,
  `eslint-config-prettier`, `eslint-import-resolver-typescript`,
  `eslint-plugin-import`, `eslint-plugin-promise`, `eslint-plugin-security`,
  `eslint-plugin-unused-imports`, `typescript-eslint` (exact ranges in
  `package.json`).
- **`peerDependencies`:** `eslint`, `typescript`, and **optional** framework or
  feature plugins (Next.js, React, Astro, Tailwind, `eslint-plugin-code-policy`,
  and others as listed in `package.json`).
- **`peerDependenciesMeta`:** `optional: true` for non-universal presets.

`@busirocket/prettier-config` and `@busirocket/tsconfig` keep **peer-only**
Prettier / plugins / TypeScript as documented in each `package.json`.

## Compatibility matrix (supported)

These are the **supported** environments for consuming the published packages.
Patch minimums may move forward in semver-minor releases; breaking bumps follow
semver for each package.

| Requirement                  | Supported range (initial)                                             |
| ---------------------------- | --------------------------------------------------------------------- |
| Node.js                      | `>=20`                                                                |
| ESLint                       | `>=9` (flat config)                                                   |
| TypeScript                   | `>=5.4` (align with `typescript-eslint` and the plugin)               |
| ESLint config format         | **Flat config** (`eslint.config.*`) is the documented and tested path |
| Module style in examples     | **ESM-first** (`"type": "module"` where applicable)                   |
| Package managers (docs + CI) | **pnpm** and **npm**; Yarn is not guaranteed                          |

CommonJS-only consumers are **out of scope** unless explicitly documented later.

## Repository boundaries

- **This repo (`engineering-baseline`):** published config packages, templates,
  CLI, and product docs.
- **`eslint-plugin-code-policy`:** plugin source, rule changes, and plugin
  README (link to `@busirocket/eslint-config` for the full stack).
