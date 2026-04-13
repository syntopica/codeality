# Migrating to `@busirocket/*` baseline packages

Use this guide when moving from ad-hoc ESLint / Prettier / TypeScript settings
or from older `@repo/*` workspace names to published
`@busirocket/eslint-config`, `@busirocket/prettier-config`, and
`@busirocket/tsconfig`.

## Prerequisites

- Node.js 20+
- ESLint 9+ with **flat config** (`eslint.config.*`)
- TypeScript 5.4+ (see [platform-decisions.md](./platform-decisions.md))

## 1. Install packages

```bash
pnpm add -D @busirocket/eslint-config@^0.1.0 @busirocket/prettier-config@^0.1.0 @busirocket/tsconfig@^0.1.0
```

Use `npm install -D` with the same spec if you use npm.

## 2. ESLint flat config

Remove legacy `.eslintrc.*` and `FlatCompat` bridges. Add `eslint.config.ts` (or
`.mjs`) that imports from `@busirocket/eslint-config/*` — see
[eslint-config README](https://github.com/BusiRocket/eslint-config/blob/main/README.md)
and [standards/eslint.md](./standards/eslint.md).

Install **peer** packages required by the stacks you use (Next.js, React, Astro,
and so on). Run ESLint and fix new violations incrementally.

## 3. Prettier

Point `prettier.config.mjs` at `@busirocket/prettier-config` (or `/frontend`,
`/astro`). Install Prettier and optional plugins listed in that package's
`peerDependencies`.

## 4. TypeScript

Extend `@busirocket/tsconfig/*` from your `tsconfig.json` (for example
`./base.json`, `./nextjs.json`).

## 5. Verify

```bash
pnpm exec create-baseline --check
```

Or `npx @busirocket/create-baseline@^0.1.0 --check` outside this monorepo.

## Naming note

Templates in this repository use **semver** ranges for `@busirocket/*` on npm
(for example `^0.1.0`). The root `package.json` may temporarily use
`pnpm.overrides` to resolve those packages from GitHub until they are published.
