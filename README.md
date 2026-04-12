# engineering-baseline

Shared engineering standard and boilerplate for this project portfolio.

This repository is the source of truth for:

- Project templates (Next.js, Astro, Vite + React, TS package)
- Engineering standards documentation

Shared **@vibracomet/\*** packages (ESLint, Prettier, TypeScript configs, and
the `create-baseline` CLI) live in dedicated GitHub repositories and are
published to **npm**. See the Packages table below.

## Quick start

In this monorepo, templates depend on **`@vibracomet/*` at `^0.1.0`**. Until
those versions exist on the npm registry, the root `package.json` uses
**`pnpm.overrides`** to resolve them from the `VibraComet/*` GitHub repos. After
the first npm publish, remove those overrides so installs use the registry only.

For a real new project:

1. Copy the relevant template from `templates/` into a new directory.
2. Keep `@vibracomet/*` dependencies at semver ranges such as `^0.1.0` (or pin
   as needed).
3. Run `pnpm install`.
4. Run `pnpm check:all` before the first commit.

In this monorepo, `pnpm fix:all` runs ESLint fixes and Prettier across all
workspace packages and the repository root (docs, configs, templates).

Published package scope is **`@vibracomet/*`**. Use semver ranges from npm (for
example `^0.1.0`).

**Decisions and compatibility:**
[docs/platform-decisions.md](./docs/platform-decisions.md).

**Adoption:** [docs/adoption/new-repo.md](./docs/adoption/new-repo.md),
[docs/adoption/existing-repo.md](./docs/adoption/existing-repo.md),
[docs/migration.md](./docs/migration.md).

## Packages

Source code and releases for shared packages live in separate repositories (not
in this monorepo):

| Package                       | Repository                                                                  | Description                                                                          |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `@vibracomet/eslint-config`   | [VibraComet/eslint-config](https://github.com/VibraComet/eslint-config)     | Flat ESLint configs — base + nextjs / astro / vite-react / node                      |
| `@vibracomet/tsconfig`        | [VibraComet/tsconfig](https://github.com/VibraComet/tsconfig)               | TypeScript configs — base + app / nextjs / astro / vite-react / node                 |
| `@vibracomet/prettier-config` | [VibraComet/prettier-config](https://github.com/VibraComet/prettier-config) | Prettier — base (organize-imports, css-order, MD wrap) + frontend (Tailwind) + astro |
| `@vibracomet/create-baseline` | [VibraComet/create-baseline](https://github.com/VibraComet/create-baseline) | CLI to scaffold baselines from templates                                             |

### Maintainers: npm publish

Each package repo has a **publish** workflow on tags matching `v*.*.*`.
Configure the **`NPM_TOKEN`** repository secret on GitHub (Settings > Secrets
and variables > Actions), then push a tag (for example `v0.1.0`) to run the
workflow. After `@vibracomet/*@0.1.0` exists on npm, remove the
**`pnpm.overrides`** entries for those packages from this repository's root
`package.json` so installs resolve from the registry only.

## Documentation

Full standards live in
[`docs/engineering-guide.md`](./docs/engineering-guide.md).
