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

## Stable executables (semver)

| Binary              | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `baseline-env-init` | Seed a gitignored `.env` from the committed `.env.example` |

`baseline-env-init` takes no arguments and always exits 0. It copies
`.env.example` to `.env` in the current working directory, does nothing when
`.env` already exists, and does nothing when there is no `.env.example`. Wire it
into `prepare` so a freshly cloned project boots with the documented example
values instead of failing its startup env validation.

Each export entry resolves to **TypeScript source** (`*.ts`) published in the
package. Consumers load it with **ESM** and a TypeScript-aware runner (for
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
  load these factories with ESM and a TypeScript-aware runtime (`jiti`), never
  `require`.
- **`internal-resolution-error`** — `./knip` and `./dependency-cruiser` import
  `knip`/`dependency-cruiser`, declared as **optional peer dependencies**.
  `attw`'s sandbox only contains this package's own tarball, so it cannot see
  peers a real consumer installs, and flags those imports as unresolved. This is
  the intended shape of an optional peer, not a broken `exports` entry.
