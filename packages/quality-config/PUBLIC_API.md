# Public API (`@busirocket/quality-config`)

Semver applies to **export subpaths** listed below. Import paths not listed here
are **private** and may change without a major bump.

## Stable exports (semver)

| Export subpath                                  | Purpose                                                     |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `@busirocket/quality-config`                    | Barrel re-exporting every factory and constant below        |
| `@busirocket/quality-config/knip`               | `createKnipConfig` — unused files/exports/deps gate         |
| `@busirocket/quality-config/dependency-cruiser` | `createDepCruiserConfig` — module boundary and cycle gate   |
| `@busirocket/quality-config/type-coverage`      | `TYPE_COVERAGE_THRESHOLD` — minimum non-`any` type coverage |
| `@busirocket/quality-config/lefthook`           | `createLefthookConfig` — shared git hook pipeline           |

Each entry resolves to **TypeScript source** (`*.ts`) published in the package.
Consumers load it with **ESM** and a TypeScript-aware runner (for example `jiti`
or your bundler) as shown in the package README.

## Implementation detail

Internal modules under `src/` that are not re-exported through the table above
are **not** public API.
