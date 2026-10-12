# Maintainers

## npm publish

Publishing is a **manual** GitHub Actions run, one package at a time - pushing a
tag does not publish anything. Trigger it from the Actions tab or with
`gh workflow run publish.yml -f package=<name>`; it publishes the version
currently in that package's `package.json`.

There is no `NPM_TOKEN`. Auth is tokenless via npm Trusted Publishing (OIDC):
npmjs.com lists this repo and `publish.yml` as a trusted publisher for each
package, pnpm exchanges the GitHub OIDC id-token for a short-lived credential,
and provenance is generated automatically because the repository is public.

Cut release tags **annotated**, with
`git tag -a <name>@<version> -m "<message>"`. A lightweight tag records no
message and no tagger. `pnpm release:check` warns about every lightweight tag it
finds so the history stops mixing both kinds; it does not fail on them, because
a pushed release tag is immutable.

## Turborepo & Check Pipeline

The repository uses **Turborepo** to orchestrate pipelines via `pnpm check:all`.
The `type-check` command is configured in `turbo.json` with a strict dependency
on `^build`. This avoids race conditions where dynamically built definitions
(e.g., `eslint-plugin-code-policy/dist/*.d.ts`) are wiped out or not properly
resolved during parallel type checking. A `dupes` task runs `jscpd` across the
repo as a cross-file duplication gate, failing the pipeline above a 1%
duplication threshold.

CI splits into three parallel jobs so a failure names its own family without
reading the log. Every gate, its threshold, and how to handle a false positive
is documented in
[docs/standards/quality-gates.md](./docs/standards/quality-gates.md).

- **`verify`** - `pnpm check:ci` (`sync-versions:check` for derived-file drift,
  type-check, lint with `--max-warnings 0`, test, build, format check, `jscpd`
  duplication) plus a separate `pnpm perf:check` step (Lighthouse budgets;
  CI-only, see the reference doc for why it isn't part of `check:ci`).
- **`quality`** - `pnpm check:quality`: `knip` (dead files/exports/deps),
  `dependency-cruiser` (import cycles, orphan modules, package/template
  boundary), `type-coverage`, and `publint`/`attw` (published package `exports`
  correctness). It names the gate that fails rather than reporting only an
  aggregate exit code.
- **`security`** - three discrete CI steps, not the `check:security` script: a
  pinned `gitleaks` binary running `pnpm run secrets:check` (committed secrets,
  full git history - `gitleaks/gitleaks-action@v2` needs a paid license for
  organization repos, so this repo installs the release binary instead),
  `pnpm run audit:check` (`pnpm audit --audit-level=high`), and
  `raven-actions/actionlint@v2` (workflow syntax). `pnpm check:security` is the
  local-developer equivalent, not the same check: it scans only the working tree
  with `gitleaks detect`, not the full history CI can see, so a clean local run
  does not prove the CI job would also pass.

The ESLint suppressions ratchet (`lint:suppress` / `lint:prune`), the
`vitest`/`testing-library` ESLint rules, `lefthook` git hooks, and Renovate run
alongside these but aren't their own CI job - see the reference doc for where
each one runs.

## Workarounds & Patches

Because this baseline aggressively adopts **ESLint 10 (Flat Config)** alongside
full type-strictness natively, we employ `pnpm patch` to fix temporary backwards
incompatibilities in third-party plugins:

- **`eslint-plugin-react@7.37.5`**: Patched to replace the deprecated
  `context.getFilename()` API with the native `context.filename` property. This
  prevents runtime crashes during `lint` steps.

## Documentation

Full standards live in
[`docs/engineering-guide.md`](./docs/engineering-guide.md).
