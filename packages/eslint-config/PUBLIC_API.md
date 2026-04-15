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
| `@busirocket/eslint-config/code-quality`        | Sonar + code-policy structural rules                              |
| `@busirocket/eslint-config/accessibility`       | jsx-a11y                                                          |
| `@busirocket/eslint-config/tailwind`            | Tailwind CSS plugin                                               |
| `@busirocket/eslint-config/frontend-boundaries` | `eslint-plugin-boundaries` layer map only                         |

Each entry resolves to **TypeScript source** (`*.ts`) published in the package.
Consumers load flat config with **ESM** and a TypeScript-aware runner (for
example `jiti` or your bundler) as shown in the package README.

## Implementation detail

Internal modules under `src/` that are not re-exported through the table above
are **not** public API.
