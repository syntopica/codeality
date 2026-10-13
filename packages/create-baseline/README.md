# @syntopica/create-baseline

CLI that adopts and audits the `@syntopica` quality baseline in a project. It
prints the install line for missing baseline packages, scaffolds the missing
quality-gate wiring (`--write`), and checks that every gate is actually wired
into what CI runs (`--check`, `--fix`).

It does not create your ESLint, Prettier or TypeScript setup, and it never
touches source code. The generated scripts call the project's existing `lint`,
`type-check`, `format` and `test` scripts, so those must exist; copy them from
the closest template under `templates/*` if they do not.

## Requirements

- Node.js 20+

## Install

Use via `pnpm dlx` / `npx` (no need to add as a dependency for one-off checks):

```bash
pnpm dlx @syntopica/create-baseline --soft
```

## Usage

| Flag      | Behavior                                                                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--soft`  | Print recommended `pnpm` / `npm` install lines (default if no other flag); also advises on missing config files                                                                                                                                     |
| `--check` | Exit non-zero if baseline packages are missing, or if the gates are not wired: `--max-warnings 0`, every gate reachable from CI, a workflow on push, SHA-pinned actions, coverage thresholds, installed hooks, dependency ranges, tsconfig coverage |
| `--fix`   | `--check`, then repair the mechanical findings it can                                                                                                                                                                                               |
| `--hard`  | Like `--check`, and require `eslint.config.*` plus `knip.config.ts`/`.js`, `lefthook.yml`, and `renovate.json` to exist                                                                                                                             |
| `--write` | Scaffold the quality-gate wiring this project is missing, then print what is still to install                                                                                                                                                       |

A `--check` finding can be waived by id in `baseline.exceptions.json` with a
`reason` and an optional `expires` date, which is enforced. See the
[existing-repo guide](../../docs/adoption/existing-repo.md) for the full list.

### `--write`

Writes `knip.config.ts`, `lefthook.yml`, `.oxlintrc.json`, `renovate.json`,
`.dependency-cruiser.cjs` and `.github/workflows/ci.yml` (running `check:ci`,
`check:quality` and `check:security`) when they are absent, and adds the
baseline scripts `package.json` does not already define. The workflow is not
added beside unrelated existing workflows; `--check` then reports what the
existing pipeline is missing. The knip preset is read off the project's
dependencies, so a Tauri app gets `tauri` and a Nest service gets `nestjs`.

**No existing file or script value is overwritten.** Missing scripts are added
to `package.json`, which rewrites that file's formatting; every other file
already in the repo is the project's, however it got there, and a tuned knip
config is exactly what an adopter spends time on; the same goes for a `lint`
script scoped to `src`. Re-running is a no-op.

Two things the generated wiring cannot know and you should review before
committing: `deps:graph` scopes itself to `src`, and a project with e2e specs or
hand-run scripts needs those declared as knip entry points.

### ESLint peer verification

Every mode also reports the ESLint peers your config actually reaches for:
missing ones, and installed ones at a version the config cannot use. The
subpaths are read from your `eslint.config.*`, so a project that never composes
`/tailwind` is never told about `eslint-plugin-tailwindcss`.

`@syntopica/eslint-config` ships TypeScript source rather than a build, so these
resolve from your project. pnpm reports a mismatch as one line among hundreds on
install; the consequence shows up much later as a crash from inside ESLint that
names neither the baseline nor the peer. Adopting consumer-u hit three of them
in a row - one absent, one on a prerelease whose config was still
eslintrc-format, one a major behind the schema the config emits - and each took
a separate diagnosis.

Recommended baseline package versions are defined in `baseline-versions.json`
shipped with this package; update that file when releasing aligned semver bumps.

### Framework-generated TypeScript setups

`@syntopica/tsconfig` is not required when the project's own `tsconfig.json`
extends a config inside a dot-directory - build output its framework
regenerates, such as Nuxt's `./.nuxt/tsconfig.json`. There the framework owns
the compiler options end to end and the shared presets have no insertion point,
so demanding the dependency would only add a package nothing reads, which an
unused-dependency gate then reports as dead weight. Every other baseline package
is still required, and a `tsconfig.json` that cannot be parsed as JSON is
treated as authored, so an unreadable file never silently drops the requirement.

## Repository

Source and issues:
[github.com/syntopica/codeality](https://github.com/syntopica/codeality/tree/main/packages/create-baseline).

Adoption guides:
[engineering-baseline/docs/adoption](https://github.com/syntopica/codeality/tree/main/docs/adoption).
