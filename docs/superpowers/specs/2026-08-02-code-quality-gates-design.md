# Code quality gates — design

**Date:** 2026-08-02 **Status:** Approved, pending implementation

## Problem

The baseline enforces a lot inside a single file: ESLint `strictTypeChecked`,
`eslint-plugin-security`, `sonarjs`, `boundaries`, ten custom `code-policy`
rules, Prettier, strict TypeScript, 80% Vitest coverage thresholds, Lighthouse
budgets, and — since 2026-07-29 — a `jscpd` cross-file duplication gate.

What it does not catch is the class of defect that only exists **between**
files, and that manual review reliably misses as a codebase grows: exports
nobody imports, whole files that became unreachable, declared dependencies that
are dead weight, import cycles longer than one hop, committed secrets,
vulnerable transitive dependencies, broken package `exports` maps, and the slow
erosion of strict rules through suppression comments.

Three gaps are also present in the gates that already exist:

1. **`warn`-level rules never fail CI.** No lint script passes
   `--max-warnings 0`, so `complexity: 10`, `max-depth`, `max-params`,
   `max-lines-per-function: 50`, and `sonarjs/no-duplicate-string` are advisory
   only.
2. **`perf:check` never runs automatically.** The CI workflow runs `check:ci`,
   which does not include it. The Lighthouse budgets exist but nothing enforces
   them.
3. **`import/no-cycle` is capped at `maxDepth: 1`.** Only direct A→B→A cycles
   are detected; the longer cycles that actually cause trouble in large
   codebases pass.

`check:ci` additionally runs `dupes` twice — once per package through Turbo, and
once at the root. Only the root run is the cross-file gate.

## Goals

- Detect defects that span files, packages, and git history.
- Ship the detection to consumer projects, not just to this monorepo. A gate
  that only guards `baseline` itself has no effect on the apps.
- Give repos adopting the baseline a way to freeze existing violations and block
  new ones, so adoption on a large existing codebase is possible at all.
- Keep CI feedback time flat as gates are added.

## Non-goals

- Mutation testing (Stryker), SAST with taint analysis (CodeQL/Semgrep), license
  compliance, `lockfile-lint`, `markdownlint`, and `commitlint`. All viable
  later; none redesign anything decided here.
- Publishing the new package to npm. The package is left publishable and wired
  into `publish.yml`, but the publish itself is a separate, deliberate act.

## Status note: type-coverage is dropped

Every `type-coverage` reference below is superseded. The spike that gated it
(plan Task 10) found it cannot run in this repo at all: `type-coverage-core`
throws `TypeError: Cannot read properties of undefined (reading 'Unknown')`
while reading `ts.SyntaxKind.Unknown` at load time, because it cannot load the
TypeScript module behind this repo's `npm:@typescript/typescript6` alias. The
failure is in module loading, not analysis, so no configuration fixes it.

Consequences: `check:quality` does not include `types:coverage`, no
`types:coverage` script or Turbo task exists, and `type-coverage` is not added
to `THIRD_PARTY_PINS`. The type-safety ratchet is carried by the ESLint bulk
suppressions mechanism alone, which was always the load-bearing half. Debt is
recorded in `TODO.md`; the unblock is a move off the alias to a released
TypeScript 6.

## Key finding: betterer is dead, ESLint replaces it

The original shortlist included
[betterer](https://github.com/phenomnomnominal/betterer) for the ratchet (freeze
current violations, fail on new ones). It is unmaintained: `dist-tags.latest` is
`6.0.0-alpha.1`, last published **2024-12-01**, and the stable 5.x line declares
`eslint >=7` and predates flat config. Against ESLint 10 it is a liability.

It is also unnecessary. ESLint 10.8.0 ships bulk suppressions natively:

```
--suppress-all  --suppress-rule [String]  --suppressions-location path
--prune-suppressions  --pass-on-unpruned-suppressions
```

`--suppress-all` writes existing violations to `eslint-suppressions.json`; CI
then fails on any _new_ violation. `--prune-suppressions` supplies the ratchet:
once a developer fixes real debt, the matching suppression is unused and CI
forces its removal, so the count only ever decreases. One native mechanism
covers both the adoption gate and the suppression budget, with no dependency.

## Architecture

### New package: `@busirocket/quality-config`

A sibling of `eslint-config`, `prettier-config`, and `tsconfig`, following the
same conventions: `type: module`, TypeScript sources exported directly through
subpath `exports` with no build step, a `PUBLIC_API.md` declaring which subpaths
carry semver, and third-party tools declared as optional peer dependencies.

```
packages/quality-config/
  src/
    knip.ts                 createKnipConfig({ framework })
    dependency-cruiser.ts   createDepCruiserConfig({ tsConfigPath })
    type-coverage.ts        TYPE_COVERAGE_THRESHOLD
    lefthook.ts             createLefthookConfig()
    index.ts                re-exports
  PUBLIC_API.md
  README.md
  package.json
```

Configs are **factories, not static JSON**. Each template then holds a
three-line file:

```ts
// templates/nextjs-app/knip.config.ts
import { createKnipConfig } from '@busirocket/quality-config/knip'

export default createKnipConfig({ framework: 'nextjs' })
```

The alternative — copying each config into all eight templates — would create
exactly the cross-file duplication the `jscpd` gate exists to prevent.

### Gate placement

Each gate runs where it has information, not everywhere:

| Gate                                                     | Scope                                     | Rationale                                                                                                     |
| -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| knip                                                     | repo root, once                           | Understands pnpm workspaces natively; dead code across packages is only visible with a global view            |
| dependency-cruiser                                       | repo root, once                           | The coupling graph is global; also detects full-depth cycles, which `import/no-cycle` at `maxDepth: 1` cannot |
| ESLint suppressions                                      | per package                               | The suppressions file belongs next to its `eslint.config`                                                     |
| type-coverage                                            | per package/template                      | Needs each project's own `tsconfig.json`                                                                      |
| publint + attw                                           | `packages/*` only                         | The six published packages. Templates are `private: true`                                                     |
| gitleaks                                                 | CI + `pre-push`                           | Full history in CI; local hook stops it before it leaves the machine                                          |
| actionlint                                               | repo root                                 | Workflows only exist at the root                                                                              |
| `@vitest/eslint-plugin`, `eslint-plugin-testing-library` | new `testing.ts` layer in `eslint-config` | Inherited by every template through the shared config                                                         |
| Renovate                                                 | root + copied into templates              | So scaffolded repos inherit it                                                                                |
| lefthook                                                 | root + templates                          | Same                                                                                                          |

Note: `eslint-plugin-vitest` is deprecated. The maintained package is
`@vitest/eslint-plugin` (1.6.25).

### Tool versions (verified 2026-08-02)

| Tool                          | Version | Constraint                      |
| ----------------------------- | ------- | ------------------------------- |
| knip                          | 6.31.0  | `node ^20.19.0 \|\| >=22.12.0`  |
| dependency-cruiser            | 18.1.0  | `node ^22 \|\| ^24 \|\| >=26`   |
| type-coverage                 | 2.30.1  | —                               |
| publint                       | 0.3.22  | —                               |
| @arethetypeswrong/cli         | 0.18.5  | —                               |
| lefthook                      | 2.1.10  | —                               |
| @vitest/eslint-plugin         | 1.6.25  | `eslint >=8.57.0`               |
| eslint-plugin-testing-library | 7.16.2  | `eslint ^8.57 \|\| ^9 \|\| ^10` |

`dependency-cruiser` requires Node ^22; CI currently pins Node 22 for `verify`,
which satisfies it.

## CI structure

The single `verify` job splits into three parallel jobs, each doing its own
checkout, pnpm setup, and cached install:

```
verify    → pnpm check:ci        type-check, lint, test, build, format, dupes
            + pnpm perf:check    Lighthouse budgets, CI-only (see below)
quality   → pnpm check:quality   knip, dependency-cruiser, type-coverage, publint, attw
security  → three discrete steps, not pnpm check:security: gitleaks, pnpm audit, actionlint
```

Parallel jobs keep wall-clock feedback flat as gates are added, and a failure
names its own family without reading the log.

**`perf:check` is a CI step, not part of `check:ci`.** The original design put
it inside `check:ci`; execution proved that unworkable. Lighthouse cannot obtain
a first contentful paint under headless Chrome on macOS — verified both in an
automated shell and by the maintainer in an interactive terminal, same `NO_FCP`
and same exit 1, and unchanged by `--headless=new --no-sandbox`. Inside
`check:ci` the budget made the local pipeline permanently red on the templates
that failed, and passed vacuously (`0 URL(s), 0 total run(s)`) on the rest. As a
CI step on ubuntu-latest the budget is enforced where Chrome paints, without
making `pnpm check:ci` unrunnable for anyone developing on a Mac.

`gitleaks` runs with `fetch-depth: 0` — without full history it cannot see a
secret committed three commits ago. `pnpm audit --audit-level=high` fails only
on high and critical, so a moderate advisory in a devDependency does not block
the whole team.

## Scripts

Root `package.json`:

```json
"knip": "knip",
"deps:graph": "depcruise packages templates scripts",
"publish:check": "turbo run publish:check",
"lint:suppress": "turbo run lint:suppress",
"check:quality": "pnpm knip && pnpm deps:graph && pnpm publish:check",
"secrets:check": "gitleaks detect --no-banner --redact",
"audit:check": "pnpm audit --audit-level=high",
"workflows:check": "actionlint",
"check:security": "pnpm secrets:check && pnpm audit:check && pnpm workflows:check"
```

`types:coverage` is absent: see the type-coverage status note above.

Each template and package gains:

- `lint` extended with `--max-warnings 0`
- `lint:suppress` — `eslint . --suppress-all`, run once when adopting
- `lint:prune` — `eslint . --prune-suppressions`, run by a human after fixing
  debt; never wired into `lint` itself (ESLint prunes the file to disk before
  checking for staleness, so that flag on the gate always passes silently)
- `types:coverage` — `type-coverage --at-least <threshold> --strict`

Published packages (`packages/*` with `private: false`) also gain
`publish:check` — `publint && attw --pack .`.

`check:ci` drops the redundant per-package `dupes`, keeping only the root run
that is the actual cross-file gate. It does **not** gain `perf:check` — see the
CI structure section for why the budget runs as a CI step instead.

New Turbo tasks: `types:coverage`, `publish:check` (both
`dependsOn: ["^build"]`), `lint:suppress` (`cache: false`, since it writes a
file).

## Git hooks (lefthook)

`lefthook.yml` at the root and in each template:

- **pre-commit** — ESLint and Prettier over staged files only, run in parallel.
- **pre-push** — gitleaks over the pushed range.

Type-check and tests are deliberately excluded. They are slow, CI already covers
them, and a hook that takes 40 seconds gets disabled within a week.

## Initial thresholds

Chosen so the repo passes today and the bar only rises:

- **type-coverage** — `--at-least 99 --strict --ignore-files "**/*.d.ts"`. The
  baseline bans `any`, so coverage should sit near 100%. If the first real run
  comes in lower, the threshold is pinned to the measured value and recorded as
  debt in `TODO.md` — not lowered to a comfortable invented number.
- **knip** — `error` for `files`, `dependencies`, `unlisted`, `exports`,
  `types`; `warn` for `binaries` and `unresolved`, which produce false positives
  against Turbo and pnpm script indirection.
- **dependency-cruiser** — `error` on cycles (full depth), orphan modules, and
  `packages/*` importing from `templates/*`; `warn` on devDependencies reaching
  production code.
- **jscpd** — unchanged at 1%.
- **ESLint** — `--max-warnings 0` everywhere, making the existing `warn` rules
  (`complexity`, `max-depth`, `max-params`, `max-lines-per-function`,
  `sonarjs/no-duplicate-string`) enforceable. The repo currently reports zero
  warnings across all 13 Turbo tasks, so this costs no debt.

## Adoption path

For existing repos taking on the baseline, all three channels ship:

1. **Wired into all eight templates** — `lint:suppress` and `lint:prune` present
   from day one, even though a freshly scaffolded template has nothing to
   suppress.
2. **Documented** — `docs/adoption/existing-repo.md` gains the
   freeze-and-ratchet workflow; a new `docs/standards/quality-gates.md`
   documents each gate, its threshold, and why it exists.
3. **`create-baseline`** — the CLI verifies rather than scaffolds (it reports
   missing baseline packages and, under `--hard`, asserts an `eslint.config.*`
   exists). It gains the same check for `knip.config.*`, `lefthook.yml`, and
   `renovate.json`, and picks up the new tools through `baseline-versions.json`.

`scripts/sync-versions.mjs` is extended: `@busirocket/quality-config` joins
`BASELINE_CONSUMER_PACKAGES`, and the new third-party tools join
`THIRD_PARTY_PINS` alongside the existing `jscpd` entry, so consumer pins cannot
drift from the versions the templates use.

## Verification

Every gate is proven against a real violation, not against "the package
installed". Each check is a throwaway experiment: break it, confirm the gate
fails, revert. None of it is committed.

| Gate                | Proof                                                             |
| ------------------- | ----------------------------------------------------------------- |
| knip                | Add an export with no consumer → fails; remove → passes           |
| dependency-cruiser  | Create an A→B→C→A cycle → fails (today's `maxDepth: 1` misses it) |
| gitleaks            | Fake AWS key in a local commit → fails; revert                    |
| ESLint suppressions | Introduce a violation of a suppressed rule → fails                |
| publint / attw      | Break a package's `exports` map → fails                           |
| lefthook            | Commit with a lint error → hook blocks it                         |
| `--max-warnings 0`  | Function at cyclomatic complexity 11 → now breaks the build       |
| type-coverage       | Add an `as any` cast → drops below threshold, fails               |
| actionlint          | Invalid `runs-on` in a workflow → fails                           |

Final acceptance: `pnpm check:all`, `pnpm check:quality`, and
`pnpm check:security` all pass on a clean tree, and CI is green across the three
jobs.

## Delivery order

Five independently verifiable tranches:

1. **Free fixes** — `--max-warnings 0`, `perf:check` enforced in CI,
   `import/no-cycle` at full depth, drop the duplicated `dupes`.
2. **`@busirocket/quality-config`** — package scaffold plus knip and
   dependency-cruiser, wired at the root and into the templates.
3. **Type safety ratchet** — type-coverage, ESLint bulk suppressions, and the
   new `testing.ts` layer in `eslint-config`.
4. **Security and dependencies** — gitleaks, `pnpm audit`, actionlint, Renovate.
5. **Distribution** — lefthook, publint/attw, the three-job CI, docs, and
   `create-baseline` updates.

## Risks

- **type-coverage against the TypeScript 6/7 aliases.** The repo aliases
  `typescript` to `@typescript/typescript6` and uses `@typescript/native` for
  type-checking. `type-coverage` consumes the TypeScript compiler API, so it may
  behave unexpectedly against a non-standard build. Tranche 3 verifies this
  first; if it fails, the gate is dropped and the suppression ratchet carries
  the tranche alone.
- **knip false positives on the templates.** Templates deliberately hold
  scaffolding that nothing imports yet. Expect an initial tuning pass through
  `ignoreDependencies` and entry patterns, the same shape as the `jscpd`
  rollout.
- **CI job count triples install time in aggregate.** Wall clock improves, total
  runner minutes rise. Acceptable on a repo with this commit volume; Turbo
  remote caching is the lever if it ever stops being.
