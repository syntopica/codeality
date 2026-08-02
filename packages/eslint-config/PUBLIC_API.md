# Public API (`@busirocket/eslint-config`)

Semver applies to **export subpaths** listed below. Import paths not listed here
are **private** and may change without a major bump.

## Stable exports (semver)

| Export subpath                                  | Purpose                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `@busirocket/eslint-config/base`                | Core JS/TS correctness, imports, promise, security, Prettier last |
| `@busirocket/eslint-config/nextjs`              | Next.js App Router + React + frontend boundaries                  |
| `@busirocket/eslint-config/vite-react`          | Vite + React + frontend boundaries                                |
| `@busirocket/eslint-config/astro`               | Astro + TS + frontend boundaries                                  |
| `@busirocket/eslint-config/node`                | Node globals + unicorn prefer-node-protocol                       |
| `@busirocket/eslint-config/nestjs`              | Node preset + NestJS decorator-aware rule tweaks                  |
| `@busirocket/eslint-config/code-quality`        | Sonar + code-policy structural rules                              |
| `@busirocket/eslint-config/accessibility`       | jsx-a11y                                                          |
| `@busirocket/eslint-config/tailwind`            | Tailwind CSS plugin                                               |
| `@busirocket/eslint-config/frontend-boundaries` | `eslint-plugin-boundaries` layer map only                         |
| `@busirocket/eslint-config/testing`             | Vitest + Testing Library rules for test files                     |

Each entry resolves to **TypeScript source** (`*.ts`) published in the package.
Consumers load flat config with **ESM** and a TypeScript-aware runner (for
example `jiti` or your bundler) as shown in the package README.

## Implementation detail

Internal modules under `src/` that are not re-exported through the table above
are **not** public API.

## `publint`/`attw` findings that are expected, not defects

`publish:check` (`publint --strict && attw --pack . --profile node16`) ignores
two `attw` rules for this package: `cjs-resolves-to-esm` and
`internal-resolution-error`. Both are consequences of the no-build design above,
not resolution bugs:

- **`cjs-resolves-to-esm`** — every export subpath resolves to raw `.ts` ESM
  source; there is no CommonJS build to satisfy a `require()` caller. Consumers
  load these configs with ESM and a TypeScript-aware runtime (`jiti`), never
  `require`.
- **`internal-resolution-error`** — subpaths such as `./nextjs` and `./astro`
  import framework packages (`@next/eslint-plugin-next`, `eslint-plugin-astro`,
  etc.) declared as **optional peer dependencies**. `attw`'s sandbox only
  contains this package's own tarball, so it cannot see peers a real consumer
  installs, and flags those imports as unresolved. This is the intended shape of
  an optional peer, not a broken `exports` entry.
