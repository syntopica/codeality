# engineering-baseline

Shared engineering standard and boilerplate for this project portfolio.

This repository is the source of truth for:

- Project templates (Next.js, Astro, Vite + React, TS package)
- Engineering standards documentation

Shared **@busirocket/\*** packages (ESLint, Prettier, TypeScript configs, and
the `create-baseline` CLI) live in the `packages/` directory of this very
monorepo! They are managed using Turborepo and pnpm workspaces.

## Quick start

In this monorepo, the templates in `templates/` depend on the local
**`@busirocket/*`** packages via the workspace. During local development, `pnpm`
will automatically resolve these packages directly from the `packages/` folder.

For a real new project:

1. Copy the relevant template from `templates/` into a new directory.
2. Ensure you have the required versions of `@busirocket/*` packages (installing
   them from npm if you are not developing inside this monorepo).
3. Run `pnpm install`.
4. Run `pnpm check:all` before the first commit.

In this monorepo, `pnpm fix:all` runs ESLint fixes and Prettier across all
workspace packages and the repository root (docs, configs, templates).

Published package scope is **`@busirocket/*`**. Use semver ranges from npm (for
example `^0.1.0`).

**Decisions and compatibility:**
[docs/platform-decisions.md](./docs/platform-decisions.md).

**Adoption:** [docs/adoption/new-repo.md](./docs/adoption/new-repo.md),
[docs/adoption/existing-repo.md](./docs/adoption/existing-repo.md),
[docs/migration.md](./docs/migration.md).

## Packages

All core packages are maintained together inside the `packages/` directory of
this monorepo:

| Package                       | Location                             | Description                                                                          |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| `@busirocket/eslint-config`   | `packages/eslint-config`             | Flat ESLint configs — base + nextjs / astro / vite-react / node                      |
| `@busirocket/tsconfig`        | `packages/tsconfig`                  | TypeScript configs — base + app / nextjs / astro / vite-react / node                 |
| `@busirocket/prettier-config` | `packages/prettier-config`           | Prettier — base (organize-imports, css-order, MD wrap) + frontend (Tailwind) + astro |
| `@busirocket/create-baseline` | `packages/create-baseline`           | CLI to scaffold baselines from templates                                             |
| `eslint-plugin-code-policy`   | `packages/eslint-plugin-code-policy` | Custom strict ESLint rules for code boundaries, architecture, and type safety        |

### Maintainers: npm publish

We use GitHub Actions to publish all packages from this monorepo. Configure the
**`NPM_TOKEN`** repository secret on GitHub (Settings > Secrets and variables >
Actions). When a new release tag is pushed, the corresponding packages will be
built and published to the npm registry.

## Turborepo & Check Pipeline

The repository uses **Turborepo** to orchestrate pipelines via `pnpm check:all`.
The `type-check` command is configured in `turbo.json` with a strict dependency
on `^build`. This avoids race conditions where dynamically built definitions
(e.g., `eslint-plugin-code-policy/dist/*.d.ts`) are wiped out or not properly
resolved during parallel type checking.

## Workarounds & Patches

Because this baseline aggressively adopts **ESLint 10 (Flat Config)** alongside
full type-strictness natively, we employ `pnpm patch` to fix temporary backwards
incompatibilities in third-party plugins:

- **`eslint-plugin-react@7.37.5`**: Patched to replace the deprecated
  `context.getFilename()` API with the native `context.filename` property. This
  prevents runtime crashes during `lint` steps.

## Documentation

Full standards live in
[`docs/engineering-guide.md`](./docs/engineering-guide.md).
