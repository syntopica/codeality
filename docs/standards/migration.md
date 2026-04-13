# Migration Guide

How to incrementally bring an existing project onto the shared baseline without
a risky full rewrite.

## Phase 1 — Package manager and editor baseline (1 hour)

1. Confirm the project uses pnpm. If not, migrate with `pnpm import` then delete
   the old lockfile.
2. Add `"packageManager": "pnpm@9.15.4"` to `package.json`.
3. Add `.editorconfig` (copy from `templates/`).
4. Add or update `.npmrc` — remove any hardcoded tokens. Move auth to
   `~/.npmrc`.

## Phase 2 — Prettier (30 minutes)

1. Install `prettier`, `@busirocket/prettier-config`, and the peer plugins for
   your preset (`prettier-plugin-organize-imports`, `prettier-plugin-css-order`,
   and if applicable Tailwind / Astro plugins — see
   `docs/standards/prettier.md`).
2. Replace any existing `.prettierrc*` or `prettier.config.*` with the standard
   config that imports from `@busirocket/prettier-config`.
3. Remove duplicate local copies of the same plugins unless you extend the
   preset with a documented extra (e.g. Liquid).
4. Run `pnpm format` and commit the diff.
5. Add `format` and `format:check` scripts.

## Phase 3 — ESLint flat config migration (1–3 hours)

1. If the project uses `.eslintrc.*`, migrate to `eslint.config.ts` (flat
   config).
   - Remove `FlatCompat` if it was added as a migration shim.
   - Remove the `prettier/prettier` ESLint rule.
2. Extend `@busirocket/eslint-config/base` plus the appropriate framework
   extension.
3. Move any project-specific boundary/architecture rules into
   `eslint.architecture.ts`.
4. Run `pnpm lint:fix` and resolve remaining warnings.
5. Enable type-aware linting (`projectService: true`) — fix any new errors
   before merging.

## Phase 4 — TypeScript hardening (1–4 hours depending on codebase state)

1. Add `"extends": "@busirocket/tsconfig/<variant>.json"` to `tsconfig.json`.
2. Remove `allowJs: true` unless there is an active JS migration in progress
   (document it with a comment and a date).
3. Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` — fix type
   errors. Use `// @ts-expect-error` with a comment only as a last resort, never
   as a silencing trick.
4. Remove redundant compiler options that are now inherited from the shared
   base.

## Phase 5 — Scripts contract (15 minutes)

1. Add any missing scripts from the standard contract.
2. Ensure `check:all` and `check:ci` are present and correct.
3. Verify `check:ci` runs cleanly in CI.

## Phase 6 — Test runner (optional, project-by-project)

- If the project uses Jest and a migration to Vitest makes sense, do it in a
  dedicated PR.
- If Jest is justified (vendor SDK), document why in the project's README and
  keep it.

## Anti-patterns to eliminate during migration

- Duplicate config files for the same tool (`next.config.js` +
  `next.config.mjs` + `next.config.ts`)
- `postcss.config.js` + `postcss.config.cjs` in the same project
- Biome + ESLint + Prettier all active simultaneously — pick one linter strategy
- Committed auth tokens in `.npmrc`

## Rollback safety

All phases are independently committable. You can stop after any phase and the
project will be in a better state than before. Do not attempt all phases in a
single PR on a large codebase.
