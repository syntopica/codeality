# @busirocket/create-baseline

Small CLI to print install commands and verify that your project lists the
`@busirocket` baseline config packages (`eslint-config`, `prettier-config`,
`tsconfig`, `quality-config`) and optionally checks for a flat ESLint config
file and the quality-gate config files (`knip.config.ts`/`.js`, `lefthook.yml`,
`renovate.json`).

This CLI does not scaffold or copy files. It reports what's missing; you (or the
closest template under `templates/*`) provide the file.

## Requirements

- Node.js 20+

## Install

Use via `pnpm dlx` / `npx` (no need to add as a dependency for one-off checks):

```bash
pnpm dlx @busirocket/create-baseline@^0.1.0 --soft
```

## Usage

| Flag      | Behavior                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--soft`  | Print recommended `pnpm` / `npm` install lines (default if no other flag); also advises on missing config files         |
| `--check` | Exit non-zero if baseline packages are missing from `package.json`                                                      |
| `--hard`  | Like `--check`, and require `eslint.config.*` plus `knip.config.ts`/`.js`, `lefthook.yml`, and `renovate.json` to exist |
| `--write` | Scaffold the quality-gate wiring this project is missing, then print what is still to install                           |

### `--write`

Writes `knip.config.ts`, `lefthook.yml`, `renovate.json` and
`.dependency-cruiser.cjs` when they are absent, and adds the baseline scripts
`package.json` does not already define. The knip preset is read off the
project's dependencies, so a Tauri app gets `tauri` and a Nest service gets
`nestjs`.

**Nothing that exists is overwritten.** A file already in the repo is the
project's, however it got there, and a tuned knip config is exactly what an
adopter spends time on; the same goes for a `lint` script scoped to `src`.
Re-running is a no-op.

Two things the generated wiring cannot know and you should review before
committing: `deps:graph` scopes itself to `src`, and a project with e2e specs or
hand-run scripts needs those declared as knip entry points.

Recommended baseline package versions are defined in `baseline-versions.json`
shipped with this package; update that file when releasing aligned semver bumps.

### Framework-generated TypeScript setups

`@busirocket/tsconfig` is not required when the project's own `tsconfig.json`
extends a config inside a dot-directory - build output its framework
regenerates, such as Nuxt's `./.nuxt/tsconfig.json`. There the framework owns
the compiler options end to end and the shared presets have no insertion point,
so demanding the dependency would only add a package nothing reads, which an
unused-dependency gate then reports as dead weight. Every other baseline package
is still required, and a `tsconfig.json` that cannot be parsed as JSON is
treated as authored, so an unreadable file never silently drops the requirement.

## Repository

Source and issues:
[github.com/BusiRocket/create-baseline](https://github.com/BusiRocket/create-baseline).

Adoption guides:
[engineering-baseline/docs/adoption](https://github.com/BusiRocket/engineering-baseline/tree/main/docs/adoption).
