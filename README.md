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

Install `eslint` and `typescript` in your project. Importing a layer may require
**additional peer packages** (for example `@next/eslint-plugin-next` for
`nextjs`). Optional peers are listed in `package.json` under `peerDependencies`
/ `peerDependenciesMeta`.

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
3. Follow [docs/adoption/new-repo.md](https://github.com/BusiRocket/engineering-baseline/blob/main/docs/adoption/new-repo.md).

Minimal `eslint.config.ts` (Node / library):

```ts
import { createBaseConfig } from '@busirocket/eslint-config/base'

export default createBaseConfig({ tsconfigRootDir: import.meta.dirname })
```

Next.js App Router: import `createNextjsConfig` from
`@busirocket/eslint-config/nextjs` and compose with `createBaseConfig` as in the
the Next.js template in [engineering-baseline](https://github.com/BusiRocket/engineering-baseline/tree/main/templates/nextjs-app).

## Existing project

See [docs/adoption/existing-repo.md](https://github.com/BusiRocket/engineering-baseline/blob/main/docs/adoption/existing-repo.md) and
[docs/migration.md](https://github.com/BusiRocket/engineering-baseline/blob/main/docs/migration.md). Migrate to flat config first, then
layer `@busirocket/eslint-config`.

## Stacks

| Import subpath         | Use case                               |
| ---------------------- | -------------------------------------- |
| `/base`                | Core TS/JS, imports, promise, security |
| `/nextjs`              | Next.js + React + boundaries           |
| `/vite-react`          | Vite + React + boundaries              |
| `/astro`               | Astro                                  |
| `/node`                | Node libraries                         |
| `/code-quality`        | Sonar + code-policy                    |
| `/accessibility`       | jsx-a11y                               |
| `/tailwind`            | Tailwind plugin                        |
| `/frontend-boundaries` | Boundaries only                        |

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
