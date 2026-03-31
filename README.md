# engineering-baseline

Shared engineering standard and boilerplate for this project portfolio.

This repository is the source of truth for:
- ESLint configuration (base + framework extensions)
- TypeScript configuration (base + framework variants)
- Prettier configuration (base + frontend + Astro)
- Project templates (Next.js, Astro, Vite + React, TS package)
- Engineering standards documentation

## Quick start

Copy the relevant template from `templates/` into a new directory,
run `pnpm install`, and you are ready.

## Packages

| Package | Description |
|---|---|
| `@repo/eslint-config` | Flat ESLint configs — base + nextjs / astro / vite-react / node |
| `@repo/tsconfig` | TypeScript configs — base + app / nextjs / astro / vite-react / node |
| `@repo/prettier-config` | Prettier configs — base / frontend / astro |

## Documentation

Full standards live in [`docs/engineering-guide.md`](./docs/engineering-guide.md).
