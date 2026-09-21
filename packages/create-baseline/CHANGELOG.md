# @busirocket/create-baseline

## Unreleased

### Minor Changes

- feat: the estate report covers the Python projects.

  `baseline-estate` prints a second table for every project whose pyproject.toml
  depends on `busirocket-baseline-py`, found up to three levels deep because the
  adoption sweep proved Python lives nested inside repositories about something
  else. Four columns: the quality group is declared, a workflow runs
  `baseline-py gate` on push, its actions are pinned by commit, and uv.lock pins
  the current release. The audit that added it found ten gates green on one
  laptop and zero running anywhere else, which the JavaScript table could not
  see. `baseline-versions.json` now carries the Python release for the lock
  check.

- feat: two tsconfig conformance checks, and a `tscfg` column in the estate
  matrix.

  The defect they catch is the expensive kind: a gate that exits 0 while reading
  almost nothing. consumer-g's root `tsconfig.json` referenced three projects
  and its `type-check` script named only two, so `app/`, `proxy.ts` and
  `instrumentation.ts` - the largest surface in the repo - reached `check:ci`
  unchecked for months while the estate report called the repository conformant.

  `--check` now asserts, first, that every project a solution-style root
  references is reachable from `type-check` (a bare `tsc -b`/`vue-tsc -b`
  passes; a project-scoped one covers only the projects it names), and second,
  that each project tsconfig extends an `@busirocket/tsconfig` preset - judged
  per shape: a single-project root extends a preset directly, a solution root
  must not, because `baseline-type-coverage` walks its `references` and a root
  that extends instead of referencing hides every project behind one.

## 0.9.0

### Minor Changes

- feat: `--check` asserts the gates are wired, not merely installed.

  It used to assert that four packages appeared in `package.json`, which it did
  happily for a repository with no CI, a `lint` script that ignored warnings,
  and a `check:ci` that skipped knip, jscpd, dependency-cruiser and
  type-coverage. Adoption was measured by presence, so drift in enforcement was
  invisible by construction.

  Seven checks now run: the `--max-warnings 0` flag (and a numeric budget
  reported separately, because it is a ratchet rather than an oversight), every
  gate reachable from what CI actually runs, a workflow that fires on push,
  actions pinned to commit SHAs, coverage thresholds that are produced and
  enforced, lefthook installed into `.git/hooks`, and dependency ranges able to
  resolve the pinned baseline.

  Findings can be waived by id in `baseline.exceptions.json` with a required
  `reason` and an optional, enforced `expires`.

- feat: `--fix` repairs the mechanical half.

  Rewrites the lint flag, appends missing gates to the right `check:*` entry,
  widens a stuck dependency range, writes the CI workflow, and inserts a
  `thresholds` block with `autoUpdate: true` and a floor of zero - vitest's own
  ratchet, so an existing repository enters at the level its suite actually
  reaches instead of turning red on a flat 80.

- feat: `create-baseline --write` writes `.github/workflows/ci.yml`.

  No template shipped one and this tool never wrote one, so every adopter
  hand-rolled CI or skipped it; eight of seventeen had no workflow at all while
  carrying the full gate set as scripts. Four jobs, three commands, every action
  pinned to a commit SHA with the tag kept as a comment. Nothing is written over
  a workflow that already runs the gates, and a repository with unrelated
  workflows is reported rather than given a second pipeline.

- feat: `baseline-estate <dir>` - the conformance check over every consumer.

  One row per repository, one column per class of gate. Formalises the manual
  pre-publish sweep that already caught three defects the templates and the unit
  tests both missed. Exits non-zero when any consumer fails, so it can gate a
  release.

- feat: `.oxlintrc.json` and a `lint:fast` script are part of the scaffolded
  wiring, and the generated `lefthook.yml` gains a `commit-msg` hook.

### Patch Changes

- fix: the pnpm workspace parser no longer backtracks exponentially.

  `/^packages:\n((?:\s*-.*\n?)+)/m` lets `\s*` and `.*` exchange characters.
  Replaced with a line loop, which has no backtracking to reason about and says
  what it does. Found by `eslint-plugin-regexp`, newly part of the base config.

## 0.8.1

### Patch Changes

- fix: `--check` prints only the packages that are missing.

  A project missing one package was handed the full eleven-package install line,
  which reads as "you have none of this" and, pasted, re-pins ten packages
  nobody asked to touch.

## 0.8.0

### Minor Changes

- feat: read a monorepo's workspace manifests, not just the root one.

  In a pnpm or npm workspace the per-package dependencies -- eslint-config,
  tsconfig, code-policy -- are declared by each workspace. Reading only the root
  manifest reported every one of them missing: consumer-y, a repo already
  running the whole toolchain across six workspaces, was told it had none of it,
  and the peer check reported "not verified -- not installed here yet" about
  packages that were installed and working.

  Both now walk the workspaces the repo itself declares, and the peer report
  labels each workspace and suggests `--filter` for it.

## 0.7.0

### Minor Changes

- feat: detect TanStack Start and pick its knip preset.

  A Start app carries both react and vite, so it was detected as `vite-react`
  and scaffolded with entry globs that match nothing in it.

## 0.6.1

### Patch Changes

- fix: only mention the Next tsconfig's JSX trap to a Next project. 0.6.0
  printed it to every adopter, including Vite and Nuxt ones the advice cannot
  apply to.

## 0.6.0

### Minor Changes

- feat: recognise every filename a gate tool would load, and say so instead of
  writing a file the tool ignores.

  consumer-m carried a `knip.json` that set `project` to `["tsconfig.json"]`, so
  knip scanned almost nothing: 34 live dependencies reported as unused and 23
  genuinely dead files never found. `--write` checked for `knip.config.ts` and
  `knip.config.js`, saw neither, and wrote the shared factory next to it. Knip
  went on loading the json. The gate stayed broken while looking configured.

  Each entry now lists every filename its tool actually resolves -- knip's
  seven, lefthook's three, renovate's six, dependency-cruiser's five -- and a
  shadowed config is named in the output with what to do about it, rather than
  skipped in silence.

- feat: `--write` names the vitest trap that comes with the shared Next
  tsconfig.

  `@busirocket/tsconfig/nextjs` sets `jsx: preserve`, which is what Next
  documents: SWC does the transform at build time. Vitest does not go through
  SWC, so every `.tsx` test fails to parse until its own config names the
  runtime -- and on Vite 8 the older `esbuild` block is ignored, so a config
  that used to work silently stops.

## 0.5.2

### Patch Changes

- chore: refresh the `@busirocket/prettier-config` pin to `^0.2.0`.

## 0.5.1

### Patch Changes

- fix: `--write` adds `prepare: lefthook install` alongside the lefthook config.

  Without it the generated `lefthook.yml` is inert: the hooks only reach
  `.git/hooks` when `lefthook install` runs. Three repos in a row adopted the
  gates with the file in place and no hook installed, and knip caught it by
  reporting `lefthook` as an unused dependency.

  The closing note also mentions `ERR_PNPM_IGNORED_BUILDS`, which is how pnpm
  reports the other half of the same problem: lefthook's install script has to
  be allowed for the hooks to be written.

## 0.5.0

### Minor Changes

- feat: every mode reports the ESLint peers your config needs and does not have.

  `@busirocket/eslint-config` ships TypeScript source rather than a build, so
  its imports resolve from the consuming project. pnpm reports a peer mismatch
  as one line among hundreds on install, and the consequence surfaces much later
  as a crash from inside ESLint naming neither the baseline nor the peer.

  Adopting consumer-u hit three in a row: `@vitest/eslint-plugin` absent,
  `eslint-plugin-tailwindcss` on a prerelease whose `configs.recommended` is
  still eslintrc-format, and `eslint-plugin-boundaries` a major behind the
  schema the shared layer emits. Each took its own diagnosis from an opaque
  stack trace.

  The subpaths are read from the project's own `eslint.config.*`, so a project
  that never composes `/tailwind` is never told about a Tailwind plugin.
  Manifests are read out of `node_modules` rather than through
  `require.resolve`, because these packages define `exports` without a root or
  `./package.json` entry and resolving either throws while the package is
  installed and working.

## 0.4.1

### Patch Changes

- chore: refresh the `@busirocket/eslint-config` pin to `^0.7.3`.

## 0.4.0

### Minor Changes

- feat: `create-baseline --write` scaffolds the wiring instead of describing it.

  The tool could tell you `lefthook.yml` was missing and never write it, so
  every adopting repo hand-wrote the same four files and the same ten scripts.
  Measured across seven real adoptions in one sitting: the only thing that
  varied was the knip preset, which is read off the project's dependencies, and
  which directories to exempt from `no-orphans`.

  `--write` creates `knip.config.ts`, `lefthook.yml`, `renovate.json` and
  `.dependency-cruiser.cjs` when absent, and adds the baseline scripts
  `package.json` does not already define. Nothing that exists is overwritten and
  re-running is a no-op, so it is safe on a half-adopted repo.

- chore: `baseline-versions.json` now pins `dependency-cruiser`, `jiti` and
  `type-coverage`.

  `--write` generates a `.dependency-cruiser.cjs` that reaches the shared
  factory through jiti, and a `type-coverage` script behind
  `baseline-type-coverage`. Without these three on the install line the
  generated wiring fails on its first run.

## 0.3.9

### Patch Changes

- chore: refresh the `@busirocket/quality-config` pin to `^0.7.0`. Derived from
  the workspace by `pnpm sync-versions`.

## 0.3.8

### Patch Changes

- chore: refresh the `eslint-plugin-code-policy` and `@busirocket/eslint-config`
  pins. Derived from the workspace by `pnpm sync-versions`.

## 0.3.7

### Patch Changes

- chore: refresh the `@busirocket/eslint-config` pin to `^0.7.1`. Derived from
  the workspace by `pnpm sync-versions`; no check was added or removed.

## 0.3.6

### Patch Changes

- chore: refresh the `@busirocket/quality-config` pin to `^0.6.1`. Derived from
  the workspace by `pnpm sync-versions`; no check was added or removed.

## 0.3.5

### Patch Changes

- chore: refresh the `eslint-plugin-code-policy` pin to `^0.7.2`, which stops
  `file-kind-placement` firing on test files. Derived from the workspace by
  `pnpm sync-versions`; no check was added or removed.

## 0.3.4

### Patch Changes

- chore: refresh the pins injected into scaffolded projects.

  `eslint-plugin-code-policy` `^0.7.0` -> `^0.7.1` and
  `@busirocket/quality-config` `^0.5.0` -> `^0.6.0`, both carrying fixes found
  by running the 0.7.0 / 0.5.0 build against the repos that adopt it. Derived
  from the workspace by `pnpm sync-versions`; no check was added or removed.

## 0.3.3

### Patch Changes

- chore: refresh the pins injected into scaffolded projects.

  `@busirocket/eslint-config` `^0.6.0` -> `^0.7.0`, `eslint-plugin-code-policy`
  `^0.6.0` -> `^0.7.0`, and `@busirocket/quality-config` `^0.4.0` -> `^0.5.0`.
  Derived from the workspace by `pnpm sync-versions`; no check was added or
  removed.

## 0.3.2

### Patch Changes

- chore: refresh the pins in `baseline-versions.json`.

  `@busirocket/eslint-config` to `^0.6.0` and `@busirocket/quality-config` to
  `^0.3.0`. No check was added or removed.

## 0.3.1

### Patch Changes

- chore: refresh the pins in `baseline-versions.json`.

  `@busirocket/quality-config` to `^0.2.0`, `@busirocket/prettier-config` to
  `^0.1.2`, `@busirocket/tsconfig` to `^0.2.1`. No check was added or removed.

## 0.3.0

### Minor Changes

- feat: require the quality-gate half of the baseline.

  `baseline-versions.json` now also pins `@busirocket/quality-config`, `knip`
  and `lefthook`, and `--hard` additionally requires `knip.config.ts`/`.js`,
  `lefthook.yml` and `renovate.json` to exist. A project that passed `--check`
  or `--hard` on 0.2.1 will fail until it adopts those - that is the point of
  the ratchet, but it is a behavior change, not a patch.

  Pins bumped in the same file: `@busirocket/eslint-config` to `^0.5.0`,
  `eslint-plugin-code-policy` to `^0.6.0`.

### Patch Changes

- fix: stop requiring `@busirocket/tsconfig` where it cannot apply.

  A project whose own `tsconfig.json` extends a config inside a dot-directory -
  build output its framework regenerates, such as Nuxt's
  `./.nuxt/tsconfig.json` - has no insertion point for the shared presets, so
  demanding the dependency only added a package nothing reads, which an
  unused-dependency gate then reports as dead weight.

  The exemption is narrow: an authored `./tsconfig.base.json` still requires the
  package, so does a project with no `tsconfig.json`, and a `tsconfig.json` that
  cannot be parsed as JSON is treated as authored so an unreadable file never
  silently drops the requirement.

- fix: drop the `dependency-cruiser` pin consumers could not meet.
