# Migrating to `@vibracomet/*` baseline packages

Use this guide when moving from ad-hoc ESLint / Prettier / TypeScript settings
or from older `@repo/*` workspace names to published
`@vibracomet/eslint-config`, `@vibracomet/prettier-config`, and
`@vibracomet/tsconfig`.

## Prerequisites

- Node.js 20+
- ESLint 9+ with **flat config** (`eslint.config.*`)
- TypeScript 5.4+ (see [platform-decisions.md](./platform-decisions.md))

## 1. Install packages

```bash
pnpm add -D @vibracomet/eslint-config@^0.1.0 @vibracomet/prettier-config@^0.1.0 @vibracomet/tsconfig@^0.1.0
```

Use `npm install -D` with the same spec if you use npm.

## 2. ESLint flat config

Remove legacy `.eslintrc.*` and `FlatCompat` bridges. Add `eslint.config.ts` (or
`.mjs`) that imports from `@vibracomet/eslint-config/*` — see
[packages/eslint-config/README.md](../packages/eslint-config/README.md) and
[standards/eslint.md](./standards/eslint.md).

Install **peer** packages required by the stacks you use (Next.js, React, Astro,
and so on). Run ESLint and fix new violations incrementally.

## 3. Prettier

Point `prettier.config.mjs` at `@vibracomet/prettier-config` (or `/frontend`,
`/astro`). Install Prettier and optional plugins listed in that package's
`peerDependencies`.

## 4. TypeScript

Extend `@vibracomet/tsconfig/*` from your `tsconfig.json` (for example
`./base.json`, `./nextjs.json`).

## 5. Verify

```bash
pnpm exec create-baseline --check
```

Or `npx @vibracomet/create-baseline@^0.1.0 --check` outside this monorepo.

## Naming note

Internal monorepo templates use `workspace:*` for local development.
**Published** projects should depend on **semver** ranges (for example `^0.1.0`)
on npm.
