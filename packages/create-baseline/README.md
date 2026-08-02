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

Recommended baseline package versions are defined in `baseline-versions.json`
shipped with this package; update that file when releasing aligned semver bumps.

## Repository

Source and issues:
[github.com/BusiRocket/create-baseline](https://github.com/BusiRocket/create-baseline).

Adoption guides:
[engineering-baseline/docs/adoption](https://github.com/BusiRocket/engineering-baseline/tree/main/docs/adoption).
