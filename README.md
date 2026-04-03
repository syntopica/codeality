# engineering-baseline

Shared engineering standard and boilerplate for this project portfolio.

This repository is the source of truth for:

- ESLint configuration (base + framework extensions)
- TypeScript configuration (base + framework variants)
- Prettier configuration (base + frontend + Astro)
- Project templates (Next.js, Astro, Vite + React, TS package)
- Engineering standards documentation

## Quick start

Inside this repository, templates are fully wired as workspace consumers so they
can be validated in CI.

For a real new project:

1. Copy the relevant template from `templates/` into a new directory.
2. Replace `workspace:*` dependencies with published package versions from this
   baseline repo.
3. Run `pnpm install`.
4. Run `pnpm check:all` before the first commit.

In this monorepo, `pnpm fix:all` runs ESLint fixes and Prettier across all
workspace packages and the repository root (docs, configs, templates).

Until the shared packages are published, treat `templates/` as validated
reference starters rather than copy-paste-final packages.

## Packages

| Package                 | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `@repo/eslint-config`   | Flat ESLint configs — base + nextjs / astro / vite-react / node                      |
| `@repo/tsconfig`        | TypeScript configs — base + app / nextjs / astro / vite-react / node                 |
| `@repo/prettier-config` | Prettier — base (organize-imports, css-order, MD wrap) + frontend (Tailwind) + astro |

## Documentation

Full standards live in
[`docs/engineering-guide.md`](./docs/engineering-guide.md).
