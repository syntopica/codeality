# CLAUDE.md

Repo-specific instructions for `baseline`. General guidance lives in the
user-level and `~/p` instruction files.

## Publishing is done through GitHub, never `npm login`

The packages publish via **npm Trusted Publishing (OIDC)** from
`.github/workflows/publish.yml`. There is no `NPM_TOKEN` and no local npm
session anywhere in the flow — `npm whoami` returning `401 Unauthorized` on this
machine is the expected state, not a blocker. Never ask for `npm login`.

Publish one package at a time, using the version already in its `package.json`:

    gh workflow run publish.yml -f package=eslint-config

Valid `package` values: `eslint-config`, `eslint-plugin-code-policy`,
`tsconfig`, `prettier-config`, `create-baseline`, `quality-config`.

Watch it with `gh run watch`, then confirm with `pnpm release:check`, which
checks each package for its git tag, its npm version and its CHANGELOG entry.

If the publish step fails on auth, the trusted-publisher entry is missing on
npmjs.com for that package: organization `BusiRocket`, repository `baseline`,
workflow `publish.yml`, allowed action `npm publish`, no environment.

## The Python package publishes to PyPI, also without a token

`packages/baseline-py` is a uv project, outside the pnpm workspace. It publishes
through **PyPI Trusted Publishing (OIDC)** from
`.github/workflows/publish-python.yml`, the same shape as the npm flow: no
token, no `twine`, no local login.

    gh workflow run publish-python.yml -f package=baseline-py

If the publish step fails on auth, the trusted-publisher entry is missing on
pypi.org: organization `BusiRocket`, repository `baseline`, workflow
`publish-python.yml`, environment `pypi`.

Its own checks run through uv, not pnpm:

    uv run --project packages/baseline-py pytest
    uv run --project packages/baseline-py baseline-py gate --project packages/baseline-py

## Dependency updates

Update to the **latest** versions, majors included — never `--target minor`:

    ncu -u

`.ncurc.json` supplies `deep` (every workspace package.json) and the one
rejection below, so the bare command is the whole procedure. Then:

    corepack use pnpm@<version>   # ncu strips the packageManager integrity hash
    pnpm sync-versions
    pnpm check:ci

**`h3` is held at 1.x** via `.ncurc.json` `reject`. Nuxt 4.5 ships Nitro 2,
which requires `h3@^1.15.11`; with `h3@2` installed, `@nuxt/test-utils` selects
its Nitro-3 adapter and the nuxt template's tests die on
`Could not resolve "h3-next/generic"`. The template imports h3 directly in
`server/api/greeting.get.ts`, so the dependency is explicit on purpose. Lift the
rejection only when Nuxt and Nitro adopt h3 v2.
