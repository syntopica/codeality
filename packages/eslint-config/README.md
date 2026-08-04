# @busirocket/eslint-config

Flat ESLint configuration for JavaScript and TypeScript projects: shared
**base** rules plus optional layers for Next.js, Vite + React, Astro, Node,
Tailwind, accessibility, and code-quality (including
`eslint-plugin-code-policy`).

- **Public API (semver):** see [PUBLIC_API.md](./PUBLIC_API.md).
- **Platform decisions:**
  [engineering-baseline/docs/platform-decisions.md](https://github.com/BusiRocket/engineering-baseline/blob/main/docs/platform-decisions.md).

## Requirements

- Node.js 20+
- ESLint 9+ (flat config)
- TypeScript 5.4+ for type-aware linting

Install `eslint` and `typescript` in your project, plus every package listed for
the subpaths you import - see [Stacks](#stacks).

This package ships **TypeScript source**, so each subpath's `import` statements
are resolved from your project, not from a build. Under pnpm's isolated
`node_modules` that means a plugin must be a direct dependency of the consumer
even when it is a `dependencies` entry here: a missing one fails `tsc --noEmit`
with `Cannot find module '<plugin>'` before ESLint ever runs. Optional peers are
listed in `package.json` under `peerDependencies` / `peerDependenciesMeta`.

## Install

```bash
pnpm add -D @busirocket/eslint-config@^0.1.0 eslint typescript
```

Add peers for the stacks you use (React, Next.js, Astro, and so on). The
**base** stack ships several dependencies bundled with this package;
framework-specific plugins remain peers.

## New project

1. Add `@busirocket/eslint-config` and peers for your stack.
2. Add `eslint.config.ts` (or `.mjs`) using `jiti` / `tsx` / Node 22+ TypeScript
   support as needed.
3. Follow
   [docs/adoption/new-repo.md](https://github.com/BusiRocket/engineering-baseline/blob/main/docs/adoption/new-repo.md).

Minimal `eslint.config.ts` (Node / library):

```ts
import { createBaseConfig } from '@busirocket/eslint-config/base'

export default createBaseConfig({ tsconfigRootDir: import.meta.dirname })
```

Next.js App Router: import `createNextjsConfig` from
`@busirocket/eslint-config/nextjs` and compose with `createBaseConfig` as in the
the Next.js template in
[engineering-baseline](https://github.com/BusiRocket/engineering-baseline/tree/main/templates/nextjs-app).

## Existing project

See
[docs/adoption/existing-repo.md](https://github.com/BusiRocket/engineering-baseline/blob/main/docs/adoption/existing-repo.md)
and
[docs/migration.md](https://github.com/BusiRocket/engineering-baseline/blob/main/docs/migration.md).
Migrate to flat config first, then layer `@busirocket/eslint-config`.

## Stacks

Install the packages in the right-hand column alongside the subpath you import.
The list is transitive: `/code-quality` also pulls in what `/testing` needs, and
`/nestjs` what `/node` needs.

| Import subpath         | Use case                               | Install alongside                                                                                                                                                                                           |
| ---------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/base`                | Core TS/JS, imports, promise, security | `@eslint/js`, `eslint-config-prettier`, `eslint-plugin-import`, `eslint-import-resolver-typescript`, `eslint-plugin-promise`, `eslint-plugin-security`, `eslint-plugin-unused-imports`, `typescript-eslint` |
| `/nextjs`              | Next.js + React + boundaries           | `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-boundaries`                                                                                                  |
| `/vite-react`          | Vite + React + boundaries              | `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-boundaries`                                                                                               |
| `/vite-vue`            | Vite + Vue                             | `eslint-plugin-vue`, `eslint-plugin-vuejs-accessibility`, `vue-eslint-parser`, `eslint-plugin-unused-imports`, `typescript-eslint`                                                                          |
| `/astro`               | Astro                                  | `eslint-plugin-astro`, `typescript-eslint`, `eslint-plugin-boundaries`                                                                                                                                      |
| `/node`                | Node libraries                         | `eslint-plugin-unicorn`, `globals`                                                                                                                                                                          |
| `/nestjs`              | NestJS services                        | `eslint-plugin-unicorn`, `globals`                                                                                                                                                                          |
| `/code-quality`        | Sonar + code-policy                    | `eslint-plugin-code-policy`, `eslint-plugin-sonarjs`, `eslint-plugin-testing-library`, `@vitest/eslint-plugin`                                                                                              |
| `/testing`             | Vitest + Testing Library               | `@vitest/eslint-plugin`, `eslint-plugin-testing-library`                                                                                                                                                    |
| `/accessibility`       | jsx-a11y                               | `eslint-plugin-jsx-a11y`                                                                                                                                                                                    |
| `/tailwind`            | Tailwind plugin                        | `eslint-plugin-tailwindcss`                                                                                                                                                                                 |
| `/frontend-boundaries` | Boundaries only                        | `eslint-plugin-boundaries`                                                                                                                                                                                  |

`/code-quality` composes `/testing` unconditionally, so
`eslint-plugin-testing-library` is required there even in a project with no
tests.

## CLI helper

```bash
pnpm dlx @busirocket/create-baseline@^0.1.0 --check
```

`--soft` prints install commands; `--hard` also requires `eslint.config.*` in
the repo root.

## Related

- **Plugin (rules only):** `eslint-plugin-code-policy` — full baseline is
  composed here, not in the plugin.
- **Prettier / TS configs:** `@busirocket/prettier-config`,
  `@busirocket/tsconfig`.
