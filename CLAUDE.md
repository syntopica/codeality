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
`tsconfig`, `prettier-config`, `create-baseline`, `quality-config`,
`db-quality`, `ui-quality`, `test-quality`.

Watch it with `gh run watch`, then confirm with `pnpm release:check`, which
checks each package for its git tag, its npm version and its CHANGELOG entry.

If the publish step fails on auth, the trusted-publisher entry is missing on
npmjs.com for that package: organization `syntopica`, repository `codeality`,
workflow `publish.yml`, allowed action `npm publish`, no environment.

## The Python package publishes to PyPI, also without a token

`packages/codeality-py` is a uv project, outside the pnpm workspace. It
publishes through **PyPI Trusted Publishing (OIDC)** from
`.github/workflows/publish-python.yml`, the same shape as the npm flow: no
token, no `twine`, no local login.

    gh workflow run publish-python.yml -f package=codeality-py

The trusted publisher was registered on 2026-08-31 under the project's PyPI
account (its credentials and TOTP live in the password manager, never here):
owner `syntopica`, repository `codeality`, workflow `publish-python.yml`,
environment `pypi`. The GitHub `pypi` environment has to exist for the job to
run - it did not, and was created with
`gh api -X PUT repos/syntopica/codeality/environments/pypi`.

Its own checks run through uv, not pnpm:

    uv run --project packages/codeality-py pytest packages/codeality-py/tests
    uv run --project packages/codeality-py codeality-py gate --project packages/codeality-py

## The Dart packages publish to pub.dev, also without a token

`packages/codeality-dart` (`codeality_dart`) and `packages/codeality-dart-lints`
(`codeality_lints`) are pub packages outside the pnpm workspace. They publish
through **pub.dev automated publishing (OIDC)** from
`.github/workflows/publish-dart.yml`, which pub.dev triggers **only from a tag
push** - there is no `workflow_dispatch`. Bump `version:` in the pubspec, add
the `## <version>` CHANGELOG entry, then push the tag:

    git tag codeality_dart-v0.1.1 && git push origin codeality_dart-v0.1.1

The workflow checks the tag against the pubspec, runs the package's gate (or
`tool/verify_lints.sh`), then publishes through the reusable
`dart-lang/setup-dart` workflow in the `pub.dev` environment.

**The first release of each package is manual, by the owner**: pub.dev cannot
enable automated publishing for a package that does not exist yet. Run
`dart pub publish` in each package directory, signed in to pub.dev, then on the
package's Admin tab enable publishing from GitHub Actions with repository
`syntopica/codeality`, tag pattern `codeality_dart-v{{version}}` (or
`codeality_lints-v{{version}}`) and environment `pub.dev`. Publish
`codeality_lints` first: the templates and `init` depend on it. The GitHub
environment must exist:

    gh api -X PUT repos/syntopica/codeality/environments/pub.dev

Their own checks run through the Dart toolchain, not pnpm:

    cd packages/codeality-dart && dart pub get && dart run bin/codeality_dart.dart gate
    packages/codeality-dart-lints/tool/verify_lints.sh

`pnpm sync-jscpd` regenerates the jscpd defaults `codeality-dart` embeds from
`packages/quality-config/jscpd.json`; `check:ci` fails when they drift.

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
