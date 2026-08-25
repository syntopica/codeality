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
| `@busirocket/quality-config/jscpd`              | `jscpd.json` — cross-file duplication gate config           |

### `createDepCruiserConfig(options)`

Every option is optional and every default is project-agnostic: the factory
encodes no directory name belonging to any particular repository.

| Option             | Effect                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `scope`            | `'repo'` (default) emits every rule. `'workspace'` emits only `no-orphans`, for a single-workspace cruise. |
| `tsConfigPath`     | tsconfig used to resolve path aliases.                                                                     |
| `orphanExemptions` | Extra `no-orphans` path patterns, on top of the framework-convention ones built in.                        |

**`tsConfigPath` resolves relative `paths` against the current working
directory**, not against the config file that declares them - a
dependency-cruiser behavior, not a choice made here. A tsconfig that lives
somewhere other than the directory you cruise from (a framework-generated one,
say) therefore mis-resolves every alias. Cruise from the directory its paths are
written against, or pass a config whose paths are rebased to it.

Use `orphanExemptions` for directories a repo-wide cruise cannot judge - most
often a workspace whose aliases only resolve under its own tsconfig, which you
then cruise separately with `scope: 'workspace'`.

## Stable executables (semver)

| Binary              | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `baseline-env-init` | Seed a gitignored `.env` from the committed `.env.example` |
| `baseline-dupes`    | Run jscpd against this package's canonical `jscpd.json`    |

`baseline-env-init` takes no arguments and always exits 0. It copies
`.env.example` to `.env` in the current working directory, does nothing when
`.env` already exists, and does nothing when there is no `.env.example`. Wire it
into `prepare` so a freshly cloned project boots with the documented example
values instead of failing its startup env validation.

`baseline-dupes` takes the paths to scan (a bare call scans `.`) and forwards
every other argument to jscpd, where it wins over the config file. jscpd 5.x is
a Rust binary with no JS config loader, which is why this gate ships as a JSON
file plus a runner rather than as a factory: the config is read in place, never
copied into the consuming repo.

`--also-ignore <patterns>` adds ignore patterns **on top of** the shared list.
jscpd's own `--ignore` replaces that list instead, so without this a project
with one generated directory to exclude would have to restate every shared
pattern in its own script.

Every export entry except `./jscpd` resolves to **TypeScript source** (`*.ts`)
published in the package, loaded with **ESM** and a TypeScript-aware runner (for
example `jiti` or your bundler) as shown in the package README. `./jscpd`
resolves to the JSON file jscpd itself reads.

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
