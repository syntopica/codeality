### 2026-09-18

- [x] Trusted publishing is configured for all six npm packages. The five
      `@syntopica/*` packages (`eslint-config`, `prettier-config`,
      `quality-config`, `tsconfig`, `create-baseline`) had none after their
      manual first publish on 2026-09-14; each now trusts GitHub Actions
      `syntopica/codeality` `publish.yml` (`npm trust github`, one passkey
      escalation per package), confirmed on every npmjs.com access page.
      `eslint-plugin-code-policy` already trusted it. The next release of each
      is the end-to-end proof. Gotcha: `npm trust` only prints its auth URL on a
      TTY; without one it prints `***` and exits EOTP.

### 2026-09-17

- [x] Renamed the Python baseline to `codeality-py`. `syntopica-codeality-py`
      0.2.0 is on PyPI (run 35163939573, trusted publishing from a pending
      publisher on the personal account: owner `syntopica`, repository
      `codeality`, workflow `publish-python.yml`, environment `pypi`). Import
      package `codeality_py`, console script `codeality-py`, config
      `codeality-py.toml`, accepted-findings record
      `.codeality-py-baseline.json`, suppression prefix
      `# codeality-py: ignore`. Rule codes keep `BPY`. Migrated and pushed
      across the eleven adopting repositories, brain, clips, atrium and
      syntopica among them; one more carries two untracked files, renamed on
      disk only. `baseline check` reports `0 new` in every repository that
      carries a baseline except atrium, whose 2 new findings predate the rename.
      `busirocket-baseline-py` 0.1.12 stays published and unyanked.

# TODO Log

Closed work from `TODO.md`, grouped by year and month.

## 2026-09

## 2026-08

### 2026-08-31 - busirocket-baseline-py 0.1.0 published to PyPI

The Python baseline shipped. The publishing organization had no PyPI account, so
one was created, its email verified, recovery codes generated and 2FA enabled
with TOTP. The credentials, the TOTP seed and the remaining recovery codes live
in the password manager, not here.

The trusted-publisher entry is registered as a pending publisher: owner
`BusiRocket`, repository `baseline`, workflow `publish-python.yml`, environment
`pypi` (the GitHub environment had to be created first; it did not exist).

Evidence: run 33443267597 green end to end,
`uv run --isolated --with busirocket-baseline-py baseline-py --version` reports
0.1.0 from a clean environment, and `templates/python-package` now locks, syncs
and passes `baseline-py gate` against the published package. Its `uv.lock` is
committed.

- [x] 2026-08-31 - **The five bumped-but-unpublished packages are released, and
      the estate's lockfile blocker is gone.** `eslint-plugin-code-policy`
      0.7.4, `tsconfig` 0.3.0, `quality-config` 0.11.0, `eslint-config` 0.8.0
      and `create-baseline` 0.9.0 are tagged, pushed and on npm;
      `pnpm release:check` reports "6 packages fully released". No `npm login`
      at any point: publishing is
      `gh workflow run publish.yml -f package=<name>`, tokenless over OIDC, and
      `npm whoami` returning 401 on this machine is the normal state rather than
      a blocker. That premise had been recorded backwards in `TODO.md`, which is
      why the release sat blocked; it is now corrected there, in the project
      memory and in a new `CLAUDE.md`. Each package was dispatched once but
      GitHub recorded two `workflow_dispatch` runs per package (ten runs, five
      successes and five failures). The duplicate always lost the race and
      failed with
      `E403 ... cannot publish over the previously published versions`, which is
      npm refusing to overwrite an immutable version - harmless, but the
      doubling itself is unexplained and worth watching on the next release.
      Evidence: `curl registry.npmjs.org/<pkg>` shows every version live with a
      2026-08-31 timestamp, and `pnpm release:check` exits 0.

- [x] 2026-08-31 - **Every workspace dependency taken to its latest release,
      majors included.** Two passes over the root, the seven packages and the
      eight templates: patch/minor first (`9e73a4b`), then the majors it left
      behind (`4c20c50`) - eslint-plugin-regexp 2 to 3, eslint-plugin-unicorn
      57/72 to 74, globals to 17.11, NestJS 11 to 12,
      eslint-plugin-react-refresh to 0.5.5. None needed a config change. Two
      things worth keeping: `ncu` strips the integrity hash from
      `packageManager`, so `corepack use pnpm@<version>` has to follow every
      run; and `h3` cannot go to 2.x while the template is on Nuxt 4.5, which
      ships Nitro 2 and requires `h3@^1.15.11` - with `h3@2` present,
      `@nuxt/test-utils` selects its Nitro-3 adapter and the tests die on
      `Could not resolve "h3-next/generic"`. That is now encoded in
      `.ncurc.json` (`reject: ["h3"]`, plus `deep`, so `ncu -u` alone is the
      whole procedure) and explained in `CLAUDE.md`. Evidence: `pnpm check:ci`
      exits 0 with all 41 turbo tasks green.

- [x] 2026-08-28 - **The per-rule mutation pass is complete: all ten rules
      tightened, package 60.80% → 89.38%, floor ratcheted to 89.** Fourth and
      final wave (delegated to Codex CLI, verified independently) took
      `no-cross-module-deep-imports.ts` 68.52% → 94.44% and
      `no-hidden-top-level-declarations.ts` 78.29% → 94.08%; package 85.98% →
      89.38% (998 killed, 105 survived, 0 errors). Every rule now sits between
      80.47% and 94.44%. The 105 remaining survivors are the long tail
      (equivalent mutants and cosmetic message variants) - judged diminishing
      returns, so the item closes rather than chasing 100%. Evidence: own re-run
      of `pnpm run mutation` exits 0 - "Final mutation score of 89.38 is greater
      than or equal to break threshold 85" - and `pnpm vitest run` passes 251
      tests. `thresholds.break` raised to 89; any rule-logic change that weakens
      the suites now breaks the on-demand gate.

- [x] 2026-08-28 - **Third wave of the per-rule mutation pass: four more rules
      tightened, package floor ratcheted 77 → 85.** Delegated to Codex CLI with
      the 123 surviving-mutant diffs from a fresh run, verified independently.
      `file-kind-placement.ts` 65.22% → 93.04%, `one-primary-unit.ts` 62.84% →
      88.51%, `public-api-imports.ts` 66.67% → 94.44%,
      `view-logic-separation.ts` 62.65% → 86.75%; package 77.05% → 85.98% (960
      killed, 143 survived); every other rule unchanged. 36 RuleTester cases
      added across the four test files. Evidence: own re-run of
      `pnpm run mutation` exits 0 - "Final mutation score of 85.98 is greater
      than or equal to break threshold 77" - and `pnpm vitest run` passes 235
      tests. `thresholds.break` raised to 85. Only
      `no-cross-module-deep-imports.ts` (68.52%) and
      `no-hidden-top-level-declarations.ts` (78.29%) remain below 80.

- [x] 2026-08-28 - **The `check:quality` cold-run flake is closed as gone.**
      Fourth consecutive clean cold run
      (`rm -rf node_modules/.cache/turbo .turbo && pnpm check:quality`: 14/14
      tasks uncached, 6 gates, exit 0), the second on a distinct later day,
      which meets the item's own closing criterion. The original single failure
      was never reproduced; two concrete instances of its class were found and
      fixed along the way (`my-nextjs-app#type-check` depending on `^build`
      instead of its own `build`, 2026-08-24; pnpm not relinking a workspace bin
      when only the `bin` map changes, 2026-08-25, documented in
      `docs/standards/quality-gates.md`). The reporting half - the
      `scripts/check-quality.mjs` runner that names the failing step - stays, so
      any recurrence names itself.

- [x] 2026-08-28 - **Second wave of the per-rule mutation pass: three worst
      rules tightened, package floor ratcheted 67 → 77.** Delegated to Codex CLI
      with the 136 surviving-mutant diffs extracted from a fresh run, verified
      independently. `no-mixed-barrel.ts` 52.00% → 87.00%,
      `no-inline-types-in-runtime-files.ts` 54.40% → 85.60%,
      `no-inline-types.ts` 56.25% → 80.47%; package 67.68% → 77.05% (860 killed,
      234 survived); every other rule unchanged. 26 RuleTester cases added
      across the three test files; existing invalid cases now assert exact
      `messageId`, `data`, line and column. Evidence: own re-run of
      `pnpm run mutation` exits 0 - "Final mutation score of 77.05 is greater
      than or equal to break threshold 67" - and `pnpm vitest run` passes 199
      tests. `thresholds.break` raised to 77. Remaining per-rule work stays in
      TODO.md with the updated table.

- [x] 2026-08-28 - **Stryker no longer copies `coverage/` and `dist/` into its
      sandbox.** `ignorePatterns: ['coverage', 'dist']` added to
      `packages/eslint-plugin-code-policy/stryker.config.mjs` with a comment
      recording the `ENOENT ... copyfile ... coverage/base.css` crash that a
      concurrent `test` run caused mid-copy (observed 2026-08-27). Evidence:
      `pnpm run mutation` after the change exits 0 in 47s with the identical
      score - "Final mutation score of 67.68 is greater than or equal to break
      threshold 67" (755 killed, 321 survived, 0 errors).

- [x] 2026-08-27 - **`atomic-file.ts` mutation score 49.72% → 92.74%; package
      floor ratcheted 60 → 67.** First rule of the per-rule tightening pass
      (delegated to Codex CLI, verified independently). Survivors in
      `atomic-file.ts` fell 65 → 12; package score 60.80% → 67.68% (755 killed,
      321 survived); every other rule's score unchanged. Tests now assert exact
      `meta`, `messageId`, line/column, report count, and filename/AST
      boundaries instead of bare `messageId`. `stryker.config.mjs`
      `thresholds.break` raised to 67 with the ratchet comment updated.
      Evidence: own re-run of
      `pnpm --filter eslint-plugin-code-policy run mutation` exits 0 - "Final
      mutation score of 67.68 is greater than or equal to break threshold 67";
      package test suite 173 tests pass; eslint `--max-warnings 0` and
      `prettier --check` clean on both changed files. Remaining per-rule work
      stays in TODO.md with the new table.

- [x] 2026-08-27 - **The tsconfig lessons from a consumer are documented where
      the next adopter will look.** `packages/tsconfig/README.md` gained "The
      two root shapes" (single-project root extends a preset; multi-project root
      stays `{"files": [], "references": [...]}` with presets on the leaves, and
      why: `baseline-type-coverage` walks references, and the wrong shape once
      produced `type-coverage: ok . 0 / 0` over a whole repository) and "Next.js
      notes" (never include `.next/dev/types` - `TS1434` on a gitignored dev
      artifact reads as unfixable and gets the Next project dropped from
      `type-check`; and Next does not rewrite a tsconfig the preset completed,
      so it can leave `.prettierignore`). `docs/adoption/existing-repo.md`
      section 5 gained "What turning the strictness on actually costs": 33
      pre-existing findings in that consumer, all in `scripts/` and `e2e/`, two
      real bugs of the `name in obj` shape fixed with `Object.hasOwn`; plus the
      two adoption notes - the lint wave arrives WITH the tsconfig change (adopt
      eslint-config and tsconfig in one pass), and fixes belong at the source,
      never `?? ''` fallbacks. Evidence:
      `pnpm exec eslint <both files> --max-warnings 0` and `prettier --check`
      pass. Closes five TODO items in one pass.

- [x] 2026-08-27 - **Conformance grew a tsconfig column: solution references
      must reach `type-check`, and every project config must extend a preset.**
      Two new checks in `create-baseline` (`checkTsconfigProjects.mjs`,
      `checkTsconfigPresets.mjs`), `loadContext` now parses the root tsconfig
      (JSONC tolerated) and resolves a solution root's references, and the
      estate matrix gained a `tscfg` column. The first check diffs a solution
      root's `references` against the expanded `type-check` text (bare
      `tsc -b`/`vue-tsc -b` covers everything; a project-scoped `tsc -b x`
      covers only what it names); the second judges by shape - leaves must
      extend `@busirocket/tsconfig`, a solution root must not, a single-project
      root must. Verified: 162 tests pass (17 new); a scratch fixture
      reproducing that consumer's defect (three references, two type-checked,
      one hand-written leaf) yields exactly `tsconfig-project:tsconfig.app.json`
      and `tsconfig-preset:tsconfig.node.json`; the repaired consumer passes
      both checks legitimately; `pnpm estate ~/p` prints the column. Dogfooding
      caught the first offender: this repo's own root `tsconfig.json` was
      hand-written - it now extends `base.json` with `@busirocket/tsconfig`
      added as a root devDependency, and `create-baseline --check` here reports
      wiring OK. CHANGELOG carries an Unreleased entry; no version bump
      (release-time policy).

- [x] 2026-08-27 - **Advisory exceptions are machine-checked and expire.** Two
      advisories sat below the `--audit-level=high` gate, documented as prose in
      TODO.md that nothing re-checked and nothing expired. Replaced by
      `baseline-audit` (`@busirocket/quality-config`), which reads
      `.baseline-advisories.json`: a waiver needs both a `reason` and an
      `expires`, an expired waiver fails the build, and an entry missing either
      field is rejected rather than honoured. Because a judged finding now has
      somewhere to live, the gate moved from `high` to `moderate` - strictly
      stricter than before. Verified all three paths: current state exits 0 with
      one waived moderate finding, an entry back-dated to 2020-01-01 exits 1 as
      EXPIRED, and running with no allowlist exits 1. Both live entries expire
      2026-11-30.

- [x] 2026-08-26 - **cargo-baseline reads the declaring `mod`, so a
      `#[cfg(test)] mod name;` file is test scope without an inner attribute.**
      New `engine/cfg_test_module_paths.rs` resolves those declarations across
      the crate's parsed files (2018-edition module resolution, both `name.rs`
      and `name/mod.rs`, test scope inherited through plain child modules), and
      `is_test_scope_file` takes the resulting set. Verified against a fixture
      reproducing the consumer's shape: before, 23 test `unwrap()` calls counted
      as production plus a spurious `file-matches-item` error; after, zero of
      each. That crate now anchors the tip at `src/ops/clean_name.rs` with the
      correct crate total of 45. 100 tests pass.
      `docs/guides/rust-baseline-adoption.md` no longer asks adopters to add
      `#![cfg(test)]` for this tool's sake.

- [x] 2026-08-25 - **Ran 0.7.0 / 0.5.0 against the estate before either reached
      npm, and it found three defects.** 22 repos adopt
      `eslint-plugin-code-policy`, four carry a Rust crate, nine commit a
      `.jscpd.json`. Nothing had been published yet, so every one of these was
      caught before a consumer saw it.
  - **`file-kind-placement` flagged 45 React components.** 0.7.0 stripped the
    extension before the suffix check, which is right for `orderMapper.tsx` and
    wrong for `MarketSelector.tsx`. Enumerated across `~/p`: all 45 files newly
    matching a kind suffix on a `.tsx` extension were PascalCase components,
    zero were misplaced units. Reproduced in a consumer widget, 0 errors to 11.
    `is-component-filename` now holds the one definition of "component file",
    shared with the colocation anchor that had it inline.
  - **`one-primary-unit` flagged two idioms that cannot be split.**
    `export const { handlers, auth, signIn, signOut } = NextAuth(config)` (one
    consumer, 3 errors) and
    `export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)`
    (another, 4 errors), both verbatim from their official setup guides. The
    factory returns one object; splitting means calling it twice. A declarator
    whose init is a call or `new` now counts once, and
    `export const { first, second } = source` still counts as two.
  - **`baseline-dupes` could not express what five of nine repos need.** jscpd's
    `--ignore` replaces the config's list rather than merging - measured, 61
    files / 1 clone became 109 files / 4 clones - so a repo with one generated
    directory to exclude (Supabase types, migrations, a cpanel build) would have
    restated every shared pattern in its own script. `--also-ignore` merges
    through a generated config. The runner was also splitting arguments into
    paths and flags on a leading dash, which handed `120` to jscpd as a
    directory and silently dropped the flag after a `--config`; arguments are
    now forwarded untouched.
  - **What held up.** `cargo baseline check` matched the published binary's
    error counts on all four crates (0, 20, 22 and 0) while correcting the
    unwrap-density tips: in the largest, 906 calls blamed on one arbitrary file
    became 11 real ones, and 475 became 45 in another. That crate's file count
    went 523 to 538 with `tests/` read, no new errors. The canonical jscpd
    config reproduced its own result exactly (1866 files, 61 clones).
  - Evidence: A/B lint sweep across all 21 adopting repos with the plugin
    installed, before and after, **0 deltas**; every repo restored and verified
    byte-identical afterwards. 146 plugin tests, `check:ci` / `check:quality` /
    `check:security` exit 0, `cargo test` 94 pass, clippy clean. Shipped as
    code-policy 0.7.1, quality-config 0.6.0, create-baseline 0.3.4.

- [x] 2026-08-25 - **`check:quality` names the gate that fails.** It was
      `pnpm knip && pnpm knip:templates && ...`, six gates behind one exit
      code - the reason a cold-run failure got recorded as "check:quality
      failed" and could never be acted on. `scripts/check-quality.mjs` keeps the
      chain's semantics (in order, first failure stops) and prints
      `check:quality: FAIL     <step> (exit <code>)` plus the `pnpm run <step>`
      to re-run. Verified both directions: the real run prints all six `running`
      lines and `6 gates passed`, exit 0; a probe copy with an injected bad step
      prints `check:quality: FAIL     definitely-not-a-script (exit 1)` and
      exits 1. `docs/standards/quality-gates.md` documents it, along with the
      pnpm bin-relink trap that produced one such failure locally.

- [x] 2026-08-25 - **Next 16.3.2, two security overrides gone, and one flag that
      explains why.** Closes the `[!]` that had held since 2026-08-04.
  - **The alias is not rejected by Next 16.3 - its `tsc` bin is.** Next 16.3
    flipped `experimental.useTypeScriptCli` to default-on, and that path locates
    the compiler through the resolved `typescript` package's own `bin.tsc`.
    `@typescript/typescript6@6.0.2` declares `bin.tsc6` and nothing else, so
    `getTypeScriptPackageInfo` returns `tscPath: undefined` and `next build`
    aborts with "It looks like you're trying to use TypeScript but do not have
    the required package(s) installed" - having first run
    `pnpm install --save-dev typescript` over the alias. Everything the check
    actually resolves is fine: probed `hasNecessaryDependencies` from the
    template directory with Next's own module and it returns `missing: []`.
  - **`experimental.useTypeScriptCli: false` fixes it.** That sends Next back to
    the compiler API entry (`lib/typescript.js`), which resolves through the
    alias normally. Measured on 16.3.2: build fails without the flag, succeeds
    with it, type-checks in 1.5s. The flag is experimental and the template
    carries a comment saying exactly what removes it - the alias shipping a
    `tsc` bin, or a move to a real `typescript` package.
  - **Two of the three load-bearing overrides are now dead.** Deleted
    `sharp@<0.35.0` (GHSA-f88m-g3jw-g9cj) and `postcss@<8.5.18`
    (GHSA-6g55-p6wh-862q / GHSA-r28c-9q8g-f849) from `pnpm-workspace.yaml` and
    reinstalled: `pnpm audit --audit-level=high` exits 0, total findings still 2
    (1 low, 1 moderate - the pair deliberately left below the gate). `tmp`
    stays: `@lhci/cli` is still 0.15.1 and has no newer floor.
  - **The pins are ranges again.** `next`, `eslint-config-next` and
    `@next/eslint-plugin-next` go from an exact `16.2.12` to `^16.3.2`, and
    `docs/adoption/new-repo.md` no longer tells adopters the ceiling is
    untested - it gives them the flag and the measurement.
  - Evidence: `pnpm check:ci` 39/39 exit 0, `pnpm check:quality` exit 0,
    `pnpm check:security` exit 0 (gitleaks clean, audit clean at `high`,
    actionlint clean), `pnpm perf:check` exit 0, `pnpm sync-versions:check` in
    sync.

- [x] 2026-08-25 - **Release tags: the convention is now checked, not
      remembered.** `scripts/release-check.mjs` reads `git cat-file -t` for
      every tag and warns on each lightweight one, naming it and the
      `git tag -a <tag> -m "<message>"` form that avoids the next. It warns
      rather than fails, because a pushed release tag is immutable and nine of
      them already exist. README's publish section states the convention.
  - **The backlog entry undercounted.** It said three lightweight tags, all cut
    2026-08-04, with everything before them annotated. The check reports nine of
    twenty: `create-baseline@0.2.0`, `0.2.1`, `0.3.2`, `eslint-config@0.4.1`,
    `0.4.2`, `0.6.0`, `eslint-plugin-code-policy@0.5.1`, `0.5.2` and
    `quality-config@0.3.0`. The habit predates the date the entry blamed.
  - Evidence: `pnpm release:check --no-npm` exits 0 with the warning block and
    six packages reported fully released; `eslint scripts --max-warnings 0`
    clean.

- [x] 2026-08-25 - **Two gates that were quietly not gating.**
  - **`file-kind-placement` was blind to every `.tsx` file.**
    `endsWith('Mapper.ts')` and its four siblings anchored kind detection on
    `.ts`, so `orderMapper.tsx` reported nothing while `userMapper.ts` beside it
    reported `code-policy/file-kind-placement` - and in a React codebase the
    `.tsx` half is where mappers and formatters actually get written.
    `utils/strip-code-extension` removes the extension first, covering `.tsx`,
    `.js`, `.jsx` and the `.mts`/`.cts`/`.mjs`/`.cjs` variants. Probed across
    all eight templates before shipping: zero new findings, so the fix widens
    coverage without moving any existing file.
  - **The jscpd config stopped being nine copies.** `.jscpd.json` sat byte for
    byte in the repo root and all eight templates, and every adopting project
    had to copy it again - the only gate in the set that was hand-maintained
    duplication rather than shared config. It now lives once, as `jscpd.json`
    inside `@busirocket/quality-config`, with a `baseline-dupes` runner that
    points jscpd at it and forwards any extra flag. The nine files are deleted;
    `dupes` is `baseline-dupes .` in templates and
    `baseline-dupes packages scripts` at the root.
  - **The factory the TODO asked for is not possible, and that is the finding.**
    jscpd 5.x is a Rust binary that reads JSON only - no JS config loader - so
    `createJscpdConfig` could only have generated a file each consumer still
    committed, which is the duplication being removed. A JSON file read in place
    plus a runner is the equivalent that actually removes it; the config is also
    resolvable directly as `@busirocket/quality-config/jscpd`.
  - **knip needed telling, twice.** With the script no longer naming `jscpd`,
    knip reported it as an unused devDependency in all eight templates - the
    dependency is real, the runner spawns the binary rather than vendoring it.
    Added to `ignoreDependencies` in both places that judge a template: the root
    `knip.config.ts` (`pnpm knip`) and `createKnipConfig`
    (`pnpm knip:templates`, and the gate a scaffolded project runs). Declaring
    `jscpd` an optional peer of `quality-config` instead was tried and rejected:
    it trades eight errors for one, `Referenced optional peerDependencies`, and
    knip scores that at error level too.
  - Evidence: `pnpm check:ci` 39/39 tasks, exit 0; `pnpm check:quality` exit 0;
    `pnpm knip` and `pnpm knip:templates` exit 0 (both were exit 1 mid-change,
    measured); `turbo run dupes --force` 8/8 templates, 0 clones each; root
    `pnpm dupes` 4 clones at 0.48% tokens, under the 1% threshold, unchanged
    from before; `eslint-plugin-code-policy` 138 tests pass. CHANGELOG
    `Unreleased` entries added to both packages; no version bumps.

- [x] 2026-08-25 - **cargo-baseline: test scope answered once, and clippy
      actually runs.** Four backlog items that all turned on the same question -
      what counts as test code.
  - **`check` now walks `<crate>/tests`, not just `<crate>/src`.** Cargo
    integration tests were outside every rule, never read rather than
    deliberately exempted. `parse_source_files` takes both roots, and
    `collect_rust_files` skips any directory with its own `Cargo.toml` - without
    that, this crate's deliberately-broken fixture at
    `tests/fixtures/bad-crate/src/store.rs` reported its three planted errors
    against cargo-baseline itself (measured: `baseline check .` went from clean
    to 3 errors before the guard was added).
  - **Which rules speak in test scope is now one decision, not five.**
    `Rule::applies_to_test_scope` defaults to `false` and `run_rules` filters;
    `max-file-lines` and `sync-tauri-command` dropped their private copies of
    the guard. `no-inline-sql` is the one opt-in: a fixture query is still a
    query, and a large one diffs better as `sql/*.sql` behind `include_str!`. An
    inline `#[cfg(test)] mod` block inside a production file stays exempt - a
    table-driven test spells its rows out. Pinned by
    `check_reads_cargo_integration_tests_for_sql_only`, which asserts
    `tests/integration.rs` reports `no-inline-sql` and does _not_ report
    `one-primary-unit` on its second `#[test]` fn.
  - **`is_cfg_test_item` reads the whole predicate.** It parsed the attribute
    args as a single `syn::Ident`, so `#[cfg(all(test, feature = "x"))]` and
    `#[cfg(any(test, debug_assertions))]` both returned `false` and every rule
    downstream scanned those modules as production code.
    `engine/cfg_meta_mentions_test` walks `all(..)`/`any(..)` recursively and
    deliberately does not descend into `not(..)`, so `#[cfg(not(test))]` stays
    production.
  - **`unwrap-density` counts production calls and points at the worst file.**
    The tip read `./src/baseline_command.rs:1: 54 unwrap()/expect() calls`
    against a 20-line file - the crate total pinned to whichever file parsed
    first. `engine/production_unwrap_lines` returns one entry per call outside
    test scope and outside comment lines (the scan is textual, so prose naming
    the calls counted itself), and the tip anchors to the file contributing the
    most, at its first call. Re-measured on the crate itself: 54 against a wrong
    file became no tip at all - 13 production calls, then 9 once comment lines
    stopped counting, under the threshold of 10.
  - **clippy runs in CI.** `Cargo.toml` has declared `unwrap_used`,
    `expect_used` and `panic` as `deny` since the crate landed, and the `rust`
    job ran `fmt` and `test` only; the crate has no `package.json` so
    `turbo run lint` never reached it either. Added
    `cargo clippy --workspace --all-targets -- -D warnings`, and the job is now
    named `Rust` rather than `Rust tests`. It reports nothing today, which is
    the point: the deny list was already satisfied and unguarded.
  - Evidence: `cargo test --workspace` 94 passed / 0 failed (90 unit + 4
    integration, up from 87);
    `cargo clippy --workspace --all-targets -D warnings` clean;
    `cargo fmt -- --check` clean; `cargo run -- baseline check .` reports 0
    errors 0 tips; same on `templates/tauri-app/src-tauri`; `actionlint` clean.
    README and `docs/guides/rust-baseline-adoption.md` rewritten for the new
    scope rules.

- [x] 2026-08-24 - **Adoption backlog cleared:** the twelve findings that three
      real adoptions left open.
  - **`createKnipConfig` is configurable instead of a fixed preset.** Four
    findings reduced to that. A drizzle schema aggregator reported every table
    as a dead export - `drizzle.config.ts` is its only consumer - and acting on
    that report makes the next migration emit `DROP TABLE`; `ignore` excludes
    it. knip's drizzle plugin loads `drizzle.config.ts`, which throws without
    `DATABASE_URL`, so the gate needed a live database; only `drizzle: false`
    stops it, not `ignore`. A finished-but-unwired package reported its whole
    public API as dead under `includeEntryExports: true`; it is per workspace
    now. And `ignoreBinaries` no longer defaults to `['turbo', 'lhci']` - both
    resolve in every template that has them, so the entries only ever produced a
    hint no consumer could silence. `@vitest/eslint-plugin` and
    `eslint-plugin-testing-library` left the shared ignore list for the same
    reason, measured across all eight templates. Hints: 21 to 5.
  - **The zod idiom no longer fights the atomic-file rules.**
    `export const fooSchema = z.object(...)` plus
    `export type Foo = z.infer<typeof fooSchema>` tripped both
    `one-primary-unit` and `no-inline-types-in-runtime-files` - 158 of 296
    findings in one repo, and one whole package was nothing else. Unwinnable per
    file: the type cannot move without importing the schema back. `z.infer` /
    `input` / `output` / `TypeOf` and drizzle's `$inferSelect` / `$inferInsert`
    are exempt when the value is declared in the same file; derived from an
    import it is still a second unit, which the tests pin.
  - **Both missing runners now ship.** `baseline-type-coverage` runs
    `type-coverage --strict` per workspace, reading the threshold from the
    package's own constant so the two cannot drift; this repo deleted
    `scripts/type-coverage.mjs` and runs the bin (11 workspaces, same result).
    `baseline-deps-graph` cruises each workspace with its own tsconfig, which is
    what a repo-wide cruise cannot do with one `tsConfig` - the reason one
    adopter dropped dependency-cruiser rather than work around it.
  - **`cargo-baseline` recognises file-level test modules.** A
    `#[cfg(test)] mod tests;` body, or any `#![cfg(test)]` file, was scanned as
    production code. `engine/is_test_scope_file` answers it once for both rules;
    `no-inline-sql` had no path exemption at all before and now also skips SQL
    inside an inline `#[cfg(test)] mod` block by line range. The `tests` path
    component is only honoured after the last `src`, because a crate can itself
    live under `tests/` - this crate's fixtures do, and the integration test
    caught the over-broad first attempt.
  - **New rule: `sync-tauri-command`.** Tauri runs a non-async command on the
    main thread, so disk, DB or network work in one freezes the UI. Opt out per
    command with `// baseline:allow sync-tauri-command`, or per crate through
    `disabled_rules`. Dogfooding found the template's own `greet` (now marked,
    with a comment saying why) and a `one-primary-unit` violation in the rule's
    own file, which moved the `#[tauri::command]` detection into
    `engine/has_tauri_command_attribute` and removed the duplicate closure in
    `tauri-command-placement`.
  - **The last TypeScript peer context is gone.** `vue-app` and `nuxt-app`
    declared plain `typescript` because vue-tsc was assumed to need it; both
    type-check unchanged against the `npm:@typescript/typescript6` alias. That
    was what still split `eslint-plugin-boundaries` in two - the lockfile now
    holds one peer-resolved key and all five consumers resolve the same copy.
  - **Adoption docs name the two steps that ambushed people:** pnpm 11's
    `allowBuilds` (the `pnpm.onlyBuiltDependencies` field the error suggests is
    ignored), and counting the workspaces with no ESLint config at all before
    estimating - one repo had five, ~800 files, 1,118 findings. The Next
    dependencies in `templates/nextjs-app` are pinned exactly, because Next
    16.3.x rejects the TypeScript alias and a caret range handed fresh adopters
    a broken `next build`.
  - Evidence: `pnpm check:ci` exit 0 (39 tasks), `pnpm check:quality` exit 0,
    `pnpm knip` and `pnpm knip:templates` exit 0, `pnpm perf:check` exit 0 (6
    lighthouse templates), `pnpm dupes` 0.39%, `cargo test --workspace` 81
    passed, `cargo fmt -- --check` clean, and `cargo baseline check` reporting 0
    errors against the crate itself.

- [x] 2026-08-24 - **CI green on `main` for the first time since 2026-08-12**,
      plus the four follow-ups the testing-gap work left behind.
  - **The security gate is fixed, not silenced.**
    `pnpm audit --audit-level=high` reported four high advisories. Three took
    ordinary overrides: GHSA-5p4m-2wfm-xmqj in js-yaml (one entry per live
    major, since a single `<4.3.1` range would drag the 3.x line across a major)
    and GHSA-2v37-7h3g-55p8 in nanoid, via
    `prettier-plugin-css-order > postcss`. The fourth, GHSA-jmr9-qjv8-65gv in
    extract-zip, has **no patched release** - npm's latest is the vulnerable
    2.0.1, and pnpm refuses the override with "The latest release of extract-zip
    is 2.0.1". Fixed by moving the consumer instead: `@puppeteer/browsers@3.2.1`
    dropped extract-zip entirely for `modern-tar`, so an override to `^3.2.1`
    removes the edge. Verified the browser download still works by running
    `perf:check` end to end on `astro-site` (`Healthcheck passed!`, exit 0), not
    just by re-reading the audit. `pnpm audit --audit-level=high` now exits 0
    with 2 remaining findings, both below the gate.
  - **`typescript-eslint` aligned to `^8.67.0` across all nine packages**, which
    was the version skew that split `eslint-plugin-boundaries` and broke the
    config on 2026-08-24. The lockfile went from three plugin keys to two; the
    remaining split is the TypeScript alias, recorded as still open.
  - **`cargo fmt` applied and gated.** The crate had drifted at 29 places across
    14 files; `cargo fmt --all` fixed it and the `rust` CI job now runs
    `cargo fmt -- --check` before the tests. 63 tests still pass and
    `cargo run -- baseline check` still reports 0 errors on the crate itself.
  - **`templates/nextjs-app` no longer relaxes the size standard.** Its
    `eslint.architecture.ts` set `max-lines` to a 200-line warning for every
    file and 300 for components, and being spread last it beat
    `createCodeQualityConfig()`'s error at 100. Deleted after checking that no
    file in the template exceeds the real budget; the template lints clean at
    error-100. The legitimate App Router exception already lives in
    `code-quality.ts`.
  - **`one-primary-unit` now counts bound names rather than declarators.**
    `export const { first, second } = source` is one declarator, so a file
    exporting two symbols used to pass. Both it and
    `no-hidden-top-level-declarations` now share one binding-pattern walk
    (`utils/bound-identifier-names.ts`, five unit tests) instead of each
    carrying its own, so the two cannot drift on what a pattern binds. The
    Next.js route exemption is applied per name.
  - **`atomic-file` and `no-inline-types` are marked deprecated** with
    `replacedBy`, rather than removed - both have been `'off'` in the
    recommended config since the narrower rules replaced them, and a consumer
    who enabled them directly stays working. Excluding them from the coverage
    gate as unsupported surface puts the package at 95.29% statements, 85.35%
    branches, 100% functions, 96.61% lines over 127 tests.
  - Evidence: `pnpm check:ci` exit 0, `pnpm knip` exit 0,
    `pnpm audit --audit-level=high` exit 0, `cargo test --workspace` 63 passed,
    `cargo fmt -- --check` clean, `actionlint` clean, and CI run 32775048272
    green on all four jobs - Verify, Quality gates, Rust tests and Security
    gates - which is the first fully green `main` since 2026-08-12.

- [x] 2026-08-24 - **Testing gaps:** close the five items the test-policy audit
      opened the same day.
  - **Coverage was declared but never measured.** Seven templates carried
    `thresholds: { lines/functions/branches/statements: 80 }` while their script
    was a bare `vitest run`, so the gate never ran and turbo's
    `outputs: ["coverage/**"]` produced the `no output files found` warning on
    every CI run. Measured first, then enabled: all seven report 100% on every
    metric, so `--coverage` was free to turn on. `nestjs-app` had no thresholds
    at all and sat at 23% - `main.ts` and `app.module.ts` are now excluded as
    bootstrap/DI wiring, a missing `app.controller.spec.ts` was added, and it
    reports 100% statements/functions/lines. It carries no `branches` threshold
    on purpose: Nest's class decorators compile to code v8 attributes to the
    decorated line, so `@Controller()` alone reports an unreachable uncovered
    branch (50%, 1/2).
  - **`packages/eslint-plugin-code-policy` had no thresholds either**, and
    measuring it found real holes rather than phantom ones: 84.4% statements and
    73.64% branches. Rather than lower the bar, the two least-covered paths got
    tests - `no-hidden-top-level-declarations` (47.61% statements: export
    specifier lists, `export default` identifier and HOC unwrapping,
    object/array/rest destructuring) and `one-primary-unit` (51.85% branches:
    specifier-list exports and the Next.js route exemption reached through one).
    107 tests became 120, and the package now reports 93.27%/81.17%/ 100%/94.78%
    against an 80% gate, with the barrel, version constant and shipped presets
    excluded as declarative wiring.
  - **`cargo test` never ran in CI.** `packages/cargo-baseline` has no
    `package.json`, so it is not a pnpm workspace member and `turbo run test`
    skipped it; no workflow step covered it either. A `rust` job now runs
    `cargo test --workspace` (GitHub's ubuntu runners ship a stable toolchain,
    so no third-party toolchain action was added). 63 tests, green.
  - **Rust and TypeScript disagreed on whether tests cost file budget.**
    `max-file-lines` counted the lines of an inline `#[cfg(test)] mod tests`
    block against the file, while a TS test file now gets its own budget. A new
    `engine/cfg_test_line_ranges.rs` returns the inclusive line ranges of those
    blocks and the rule skips them, so the budget measures production code on
    both sides. Spans are read off single tokens (`#` of the first attribute,
    the closing brace of the block) because proc-macro2 cannot join spans on
    stable and an item-level `span()` collapses to its first token. Verified by
    two new rule tests plus three for the helper, and
    `cargo run -- baseline check` still reports 0 errors against the crate
    itself.
  - **jscpd's `minTokens: 70` was left alone, deliberately.** Measured at 30
    over test globs: 12 clones, 9.55%. Ten of them are the same starter file in
    different templates (`tauri-app` vs `vite-react-app` vs `vue-app`), which is
    what templates are for, and the rest are import + `afterEach` headers whose
    extraction would make the tests worse. Per template the signal is one clone
    in `vue-app` (a 6-line fetch stub) and one in `astro-site` (an import
    header); nextjs-app has none. The percentages only look alarming because the
    denominators are 44-82 lines. No change to the gate.
  - **The rule tester no longer casts.** `@typescript-eslint/rule-tester`
    replaced ESLint core's `RuleTester`; it is generic over the same
    `RuleModule` shape `createRule()` produces, so both cast type aliases are
    gone and no suite carries `as any`. This required aligning
    `@typescript-eslint/utils` to `^8.67.0`: the tester pulled its own copy and
    two versions of the same types are structurally incompatible under
    `exactOptionalPropertyTypes`. The undeclared `@typescript-eslint/parser`
    that the old helper reached through hoisting is gone with it - the tester
    defaults to that parser.
  - Evidence: `pnpm check:ci` exit 0 (39 turbo tasks), `pnpm knip` exit 0,
    `pnpm dupes` exit 0, `cargo test --workspace` 63 passed, `actionlint` clean.

- [x] 2026-08-04 - **Consumer findings:** Fix the five gaps that adopting the
      standard in a consumer (Next.js 16, ESLint 10.8) exposed.
  - Result: `quality-config` 0.4.0. The knip Next.js preset named
    `middleware.ts`, renamed `proxy.ts` in Next 16, so the proxy read as an
    unused file; it now matches either in one pattern, and the App Router
    metadata routes plus `global-error` joined the entry alternation. The
    dependency-cruiser `no-orphans` exemptions covered only `sitemap` and
    `robots`, so a normal App Router reported one orphan per route file; every
    convention is exempt now, at any depth, and so is `middleware`/`proxy`.
  - The exemptions are two patterns rather than one with `(.*/)?` on purpose:
    dependency-cruiser runs every `pathNot` entry through safe-regex and
    **abandons the whole rule** when one is rejected, so a nested quantifier
    turns the orphan check off instead of narrowing it. Verified directly -
    `safe-regex` rejects `(^|/)app/(.*/)?(page)\.tsx?$` and accepts both new
    forms - and documented in the factory and in `quality-gates.md`.
  - The adoption guide now says to delete any inherited
    `settings: { react: { version: 'detect' } }` override: it reinstates the
    detection `createNextjsConfig` exists to avoid, and on ESLint 10 that is not
    a warning but every file failing at
    `Error while loading rule 'react/display-name'`.
  - The `Remove from ignoreDependencies` hints are documented as expected rather
    than patched: the preset's ESLint peer list is redundant in the one layout
    where knip resolves the real caller and load-bearing in every other, and a
    consumer-side filter would drift the moment the list changes.
  - Released as `quality-config@0.4.0` through the `publish.yml` workflow
    (tokenless OIDC trusted publishing - there is no local npm credential to
    have, which is what the 401 from `npm whoami` was really saying), on an
    annotated tag. `pnpm release:check` reports all six packages fully released.
    That consumer is on `^0.4.0` with its local patches deleted and both gates
    green, which is the acceptance test passing for real rather than against a
    working copy.
  - Evidence: the new patterns were unit-checked against 13 real consumer paths
    (route files, nested routes, metadata routes, `src/proxy.ts`, and the
    near-misses `app/blog/mypage.tsx` and `src/lib/route.ts`),
    `pnpm check:quality` passes here, and the consumer passes `knip` and
    `deps:graph` with its local patches deleted and this factory in place.

- [x] 2026-08-04 — **release:** cut `eslint-config@0.6.0`,
      `quality-config@0.3.0` and `create-baseline@0.3.2` up to the tag. Both
      minors are behavior changes rather than patches: the React presets now
      report a concrete `settings.react.version` and accept a `reactVersion`
      option, and the knip Next.js preset changes what a `src/app` project sees.
      `eslint-config` also carried one patch that had been unreleased since
      `0.5.0` - the `.lighthouseci/` ignore from `cb20628`. `create-baseline`
      follows because `baseline-versions.json` pins the two bumped packages, the
      same pairing as the `0.3.1` release.
  - Result: three tags on `ac7b511`, pushed, and all three published to npm
    through the manual `publish.yml` `workflow_dispatch` (tokenless OIDC),
    `create-baseline` last so it never pinned a version npm did not yet serve.
    `pnpm release:check` -> `6 packages fully released.`
  - Evidence: `pnpm run check:ci`, `check:quality` and `check:security` all exit
    `0` before the tag; `sync-versions --check` reports derived files in sync;
    workflow runs `30902237324`, `30902305336`, `30902401887` all successful;
    `npm view` returns `0.6.0` / `0.3.0` / `0.3.2`.
  - Note: these three tags were created lightweight while every earlier release
    tag is annotated. They are pushed and immutable, so the fix belongs to the
    next release - tracked in `TODO.md`.
  - Files: `packages/{eslint-config,quality-config,create-baseline}/`
    `package.json` and `CHANGELOG.md`,
    `packages/create-baseline/baseline-versions.json`.

- [x] 2026-08-04 — **security:** three newly published `high` advisories broke
      `pnpm audit:check`, and the gate is green again. They were not caused by
      any change in this repo: audit resolves against the live advisory
      database, and the same three appear on the untouched lockfile at `HEAD`.
      `ip-address@<10.3.1` (GHSA-mwp4-54f8-5fhr, via
      `@lhci/cli > proxy-agent > socks`) and `brace-expansion` on two majors
      (GHSA-rgw5-rvv9-x895, via `nuxt > @nuxt/nitro-server` and via
      `eslint > @eslint/config-array > minimatch`). All three survived
      `pnpm dedupe`, so they took the documented route: scoped entries in the
      `overrides:` block. The `brace-expansion` entries are lower-bounded
      (`>=2.0.0 <2.1.4`, `>=5.0.0 <5.0.9`) rather than the obvious
      `brace-expansion@<2.1.4`, which would also capture the installed `1.1.18`
      edge - an edge the advisory does not flag - and drag it across two majors.
      The `ip-address` pin to `^10.3.1` also cleared the two `moderate`
      `ip-address` findings, which were patched at `10.2.1` and `10.2.2`.
      Separately, `@vitest/eslint-plugin` went `1.6.25 -> 1.6.26` across the
      nine workspaces that declare it, which removed one of the paths feeding
      the low `esbuild` advisory.
  - Result: `pnpm audit` goes from `1 low | 3 moderate | 3 high` to
    `1 low | 1 moderate`; `pnpm audit --audit-level=high` exit `0`.
  - Evidence: `pnpm run check:security` exit `0` (gitleaks `no leaks found`,
    audit, actionlint); `pnpm run check:ci` exit `0`; `pnpm run check:quality`
    exit `0`.
  - Files: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, nine `package.json` files
    under `packages/` and `templates/`.

- [x] 2026-08-04 — **eslint-config:** the React presets no longer depend on
      `eslint-plugin-react`'s own version detection, which is broken on
      ESLint 10. `settings.react.version` was `'detect'`, and detection calls
      `context.getFilename()`, removed in ESLint 10, so a consumer on
      `eslint@10` fails every file with
      `contextOrFilename.getFilename is not a function` before a rule runs. This
      repo could not see it: `patches/eslint-plugin-react.patch` fixes
      `resolveBasedir` locally, so the templates lint green while external
      consumers crash - the patch is what made this a report from a consumer
      rather than a failing gate here. `createNextjsConfig` and
      `createViteReactConfig` now resolve the React installed beside the linted
      project (`resolveReactVersion`, `require.resolve('react/package.json')`
      from `process.cwd()`) and hand the plugin a concrete version, with a new
      `reactVersion` option to override and `'detect'` only as the last
      fallback. The settings live in an unscoped config object because the two
      `eslint-plugin-react` flat configs carry no `files` key, so a file outside
      `**/*.{js,jsx,ts,tsx}` would otherwise re-enter detection.
      `createViteReactConfig` was fixed alongside `createNextjsConfig`: the
      report named only the Next.js preset, but `vite-react.ts` had the
      identical `'detect'` setting.
  - Evidence: probe from `templates/nextjs-app` returns `[{"version":"19.2.8"}]`
    (one settings entry, no `detect`) and
    `createNextjsConfig({ reactVersion: '18.3.1' })` returns
    `[{"version":"18.3.1"}]`; `eslint src --max-warnings 0` and `tsc --noEmit`
    clean for the package; `turbo run type-check lint` 24/24 successful.
  - Files: `packages/eslint-config/src/react-version.ts` (new),
    `packages/eslint-config/src/nextjs.ts`,
    `packages/eslint-config/src/vite-react.ts`.

- [x] 2026-08-04 — **quality-config:** the knip Next.js preset now covers the
      `src/app` layout. Entry globs were rooted at `app/`, so a project using
      `src/app/` matched none of them. The reported symptom (knip exits 0 having
      inspected nothing) did not reproduce; the measured behavior is worse in a
      different way: with no entry matching, knip reports the application's own
      route files as **unused files** and never checks their exports. Probe on a
      `src/app` fixture, old patterns: `Unused files (2)` naming both
      `src/app/y/page.tsx` and `src/lib/orphan.ts`, and the dead export in
      `page.tsx` is not reported. New patterns: only the real orphan is flagged
      and `deadEntryExport` surfaces as an unused export. Fixed by carrying both
      roots in one pattern - `{,src/}app/**/{page,layout,...}.{ts,tsx}` and
      `{,src/}middleware.ts` - rather than adding a `srcDir` option: verified
      with knip's own glob engine (`tinyglobby`) that `{,src/}` matches both
      layouts, so neither produces a `Refine entry pattern (no matches)` hint.
      `next.config.*` stays root-only, where Next.js requires it.
  - Evidence: knip probe above; `pnpm knip` and `pnpm knip:templates` both exit
    `0` with no new hint for the `templates/nextjs-app` entry patterns.
  - Files: `packages/quality-config/src/knip-framework.ts`.

- [x] 2026-08-04 — **docs:** the peer packages each `@busirocket/eslint-config`
      subpath needs are now listed per subpath. The reported gap -
      `createCodeQualityConfig` failing a consumer's `tsc --noEmit` with
      `Cannot find module 'eslint-plugin-testing-library'` - was documentation,
      not the manifest: the plugin was already an optional peer, and the
      manifest is right, because the plugin is only mandatory for the subpaths
      that reach `./testing`. The README `Stacks` table gained an
      `Install alongside` column covering all twelve subpaths, plus the reason
      the list is longer than `peerDependencies` suggests: the package ships raw
      `.ts`, so its imports resolve from the consumer and pnpm's isolated
      `node_modules` requires a direct declaration even for the config's own
      `dependencies`. `docs/adoption/existing-repo.md` points at that table and
      calls out the two easy misses (`/code-quality` needing the testing
      plugins, `/nextjs` and `/vite-react` needing `eslint-plugin-boundaries`)
      and the ESLint 10 React-version note.
  - Evidence: `pnpm format:check` clean; `pnpm knip` exit `0`.
  - Files: `packages/eslint-config/README.md`, `docs/adoption/existing-repo.md`.

- [x] `type-coverage` is not incompatible with the `@typescript/typescript6`
      alias. The blocker was misattributed and the gate now runs. Every failing
      run had been invoked through `npx`, which installs `type-coverage` into
      its own cache directory, so `require('typescript')` resolved from there
      rather than from the workspace and returned a module without
      `SyntaxKind` - hence
      `TypeError: Cannot read properties of undefined (reading 'Unknown')` at
      load time. Installed as a workspace dependency it resolves this repo's
      aliased compiler and works: `packages/eslint-config` reported 99.74% on
      the first such run. The general lesson: a tool that consumes the
      TypeScript compiler API has to be resolved from the same tree as the
      compiler, so running it through `npx` is not a test of compatibility.
      Wired as `pnpm type-coverage` (`scripts/type-coverage.mjs`), one run per
      workspace that has its own `tsconfig.json`, at 99% with `--strict`, and
      added to `check:quality`. The threshold is read from
      `@busirocket/quality-config/type-coverage` through jiti rather than
      restated, so the published constant and the gate cannot drift; the same
      shape as `scripts/deps-graph-aliased.mjs`, so no new published surface was
      needed. Exclusions are exactly two: framework build output (`.next/`,
      `.nuxt/`), whose `any`s belong to the generator, and tests, where casting
      a rule or a mock to `any` is the point. Adoption found one real defect:
      `NestFactory.create()` returns `INestApplication<any>`, holding
      `templates/nestjs-app` at 96.07%; annotating the binding as
      `INestApplication<unknown>` type-checks and takes it to 100%. Verified:
      all eleven workspaces pass (four at 100%), an injected
      `export const anyProbe = (value: any): any => value` fails the gate and
      names both positions, probe removed, `pnpm check:ci` exit 0,
      `pnpm check:quality` exit 0. `docs/standards/quality-gates.md` rewritten -
      its "type-coverage - dropped, not a gate" section and the "documented
      debt" note about the dormant export are both obsolete.

- [x] The pre-commit lint hook could not lint the files it existed for.
      `pnpm exec eslint <path>` run at the repo root resolves each plugin's own
      dependencies against the root `node_modules`, which a pnpm workspace does
      not have, so staging any file in a Tailwind template aborted the hook with
      `Error: Could not find tailwindcss` before a single rule ran. Found by
      hitting it: the commit for the knip change, which touches
      `templates/vue-app/src/main.ts`, failed. ESLint itself was never the
      problem - it walks up from the file and finds the right config; the
      plugins' runtime lookups need the workspace as the working directory.
      `scripts/lint-staged.mjs` groups the staged paths by owning workspace and
      runs eslint once per group from that directory. Verified directly: the
      same file that failed from the root passes from `templates/vue-app/`, and
      the hook now prints one `eslint (<workspace>/)` line per group and passes.
      `createLefthookConfig()` is deliberately unchanged - a single-project
      consumer has no workspaces and can keep running eslint from its root - and
      `lefthook.yml` records why the two differ.

- [x] Released and published everything the repo was holding unreleased:
      `@busirocket/quality-config@0.2.0` (the `createKnipConfig` behavior change
      from this same session - a consumer that adopts it now fails on a dead
      entry-file export, which is a ratchet, not a patch),
      `@busirocket/prettier-config@0.1.2` and `@busirocket/tsconfig@0.2.1`
      (metadata only: their published tarballs predated the commits that pointed
      `repository`/`homepage`/`bugs` at this monorepo, so npm still linked the
      retired standalone `BusiRocket/prettier-config` repo), and
      `@busirocket/create-baseline@0.3.1` (its pins are derived from those
      versions). Published in dependency order through `publish.yml`, four
      successful runs (30809357438, 30809414554, 30809464477, 30809523862).
      `create-baseline` showed the propagation lag documented earlier in this
      log - `npm view` reported 0.3.0 for a moment after a successful run - and
      settled on 0.3.1. Also pushed the three backfilled tags plus the four new
      ones. Evidence: `pnpm release:check` exit 0 with all six packages at their
      published versions, CI green on the release commit (run 30809332981), and
      `pnpm audit --audit-level=high` exit 0.

- [x] Built the release-integrity gate the "a release is not done when the
      version is bumped" entry asked for, and closed the drift it found.
      `pnpm release:check` (`scripts/release-check.mjs`) checks every
      non-private package in `packages/*` for three things: a git tag
      `<unscoped-name>@<version>`, that exact version on the npm registry, and a
      `## <version>` heading in the package's `CHANGELOG.md`. Deliberately kept
      out of `check:ci`: it needs the network, and the commit that bumps a
      version legitimately precedes both its tag and its publish, so wiring it
      into CI would fail every release commit by construction. First run failed
      on three packages nobody had noticed: `@busirocket/eslint-config@0.5.0`,
      `@busirocket/prettier-config@0.1.1` and `@busirocket/tsconfig@0.2.0` each
      had no tag and no CHANGELOG at all - the same failure as the original
      entry, three times over. npm itself was clean: all six packages' published
      versions match source. Closed by writing the three missing changelogs
      (reconstructed from git history, each entry naming the commit that
      introduced the version, with pre-monorepo releases marked as such rather
      than invented) and creating three annotated tags at the commit that bumped
      each version - `ee83404`, `84ecc6f`, and for prettier-config `2acff2e`,
      the first commit in this repository carrying 0.1.1 since the published
      release predates the monorepo migration. Evidence: `pnpm release:check`
      went from exit 1 with three FAIL blocks to exit 0 with
      `6 packages fully released`. `pnpm check:ci` exit 0, `pnpm check:quality`
      exit 0. The tags are local; pushing them is tracked in `TODO.md`.

- [x] Turned `includeEntryExports` on for the per-template knip configs, which
      Task 8 had left off by evidence. Both blockers named in that entry are
      gone. `vue-app`'s false positive on `mountApp` was fixed at the source:
      `src/main.ts` now imports `@/app/index` explicitly instead of relying on
      knip resolving the path-aliased bare `@/app` to the directory's
      `index.ts`, so `src/app/index.ts` no longer has to be listed as an entry
      and the entry-to-entry import that knip refused to count as usage no
      longer exists. `nestjs-app`'s `bootstrap` is handled with
      `ignoreExportsUsedInFile: true`, which is the correct pairing with this
      repo's Primary Unit Rule: `code-policy/no-hidden-top-level-declarations`
      forbids a hidden top-level declaration, so an entry-point helper a file
      uses only itself still has to be exported. The narrower per-type form was
      tried first and does not work - knip's schema accepts only `class`,
      `enum`, `function`, `interface`, `member`, `type` and `variable`, and
      `export const bootstrap = async () => {}` matches none of them
      (`{ function: true, variable: true }` still reported it;
      `{ unknown: true }` is rejected as invalid input). The option only hides
      an export its own file already uses, so an export nothing references at
      all still fails. Coverage is real but partial, measured with a probe
      export rather than assumed: it now fails `nestjs-app` (`src/main.ts`) and
      `ts-package` (`src/index.ts`), where nothing caught a dead entry export
      before, and still does not fail `nextjs-app` (`app/page.tsx`),
      `vite-react-app` (`src/main.tsx`) or `vue-app` (`src/main.ts`) - knip's
      framework plugins register those files as entries of their own and the
      option does not reach them. Recorded in the config comment so the next
      reader does not re-derive it. Verified: all eight templates exit 0
      (`pnpm knip:templates`), probes removed, `pnpm check:ci` exit 0,
      `pnpm check:quality` exit 0.

- [x] Evaluated `isIncludeEntryExports` for the **root** `knip.config.ts` and
      left it off, now with the concrete list the old entry could only predict.
      `pnpm knip --include-entry-exports` at the root reports 17 unused exports
      and 4 unused exported types, and every one is a false positive of a
      different kind: `@busirocket/quality-config`'s public API
      (`createDepCruiserConfig`, `createKnipConfig`, `createLefthookConfig`,
      `TYPE_COVERAGE_THRESHOLD`, each reported twice - at its source file and at
      the barrel), the `default` export of all eight templates' `knip.config.ts`
      plus `nuxt-app/vitest.config.ts` (config files a tool loads, not a caller
      imports), `nestjs-app`'s `bootstrap`, and four generated types in
      `templates/nextjs-app/.next/types/routes.d.ts`. Suppressing that many real
      public exports to enable the flag would cost more than it buys, so the
      root config keeps the default. Revisit only if knip gains a
      per-entry-pattern override.

- [x] Moved the `eslint-config` / `eslint-plugin-code-policy` cyclic-dependency
      entry out of the backlog. It is not work: it is a standing constraint that
      already enforces itself, since reintroducing a bare
      `@busirocket/eslint-config` import in the plugin breaks the build with
      `Cyclic dependency detected: eslint-plugin-code-policy#build, @busirocket/eslint-config#build`.
      Recorded as "Decision 5 - the two ESLint packages must not declare a
      workspace cycle" in `docs/platform-decisions.md`, naming both real edges,
      why only one may be declared, and that the fix is restoring the relative
      import rather than adding the dependency.

- [x] Published `@busirocket/quality-config@0.1.0` (first ever release) and
      `@busirocket/create-baseline@0.3.0`. Hit and resolved the structural limit
      worth remembering: **`publish.yml`'s tokenless OIDC path cannot do the
      first publish of a new package name.** npm requires a package to already
      exist on the registry before a trusted publisher can be configured for it,
      so there is nothing to exchange the OIDC token against. Run 30805714749
      failed with
      `Skipped OIDC: ERR_PNPM_AUTH_TOKEN_EXCHANGE ... (status code 404)`, then
      pnpm fell back to `NODE_AUTH_TOKEN` - `setup-node`'s literal
      `XXXXX-XXXXX-XXXXX-XXXXX` placeholder - and npm answered
      `E404 PUT registry.npmjs.org/@busirocket%2fquality-config`. Unblocked with
      one authenticated `npm publish` of the package, after which the trusted
      publisher was configured (org `BusiRocket`, repo `baseline`, workflow
      `publish.yml`) and `create-baseline@0.3.0` published through the workflow
      normally. **Every future new package in this repo needs the same
      bootstrap.** A brand-new package also takes minutes to appear on the
      public read path, unevenly across CDN edges: `npm access` and the
      npmjs.com settings page showed it immediately while `npm view` and an
      authenticated `GET registry.npmjs.org/...` still returned 404 from some
      edges. That is propagation, not failure - ruled out staged publishing
      (`npm stage list` empty; staging is opt-in via `npm stage publish` and
      cannot apply to a new package) and private visibility
      (`npm access get status` returned `public`). Publish order was
      load-bearing and honored: `quality-config` first, because
      `create-baseline@0.3.0` pins `@busirocket/quality-config@^0.1.0` and
      `--check` now requires it. Verified against the real registry rather than
      the workflow log: `npx @busirocket/create-baseline@0.3.0 --soft` in a
      scratch project, then every pin it prints resolved with `npm view`.
- [x] Audited all five `pnpm-workspace.yaml` security overrides for whether they
      still do anything, which the entry asked for but nobody had run. Removed
      all five at once and reinstalled: `pnpm audit --audit-level=high` went
      from 0 high to 4 high, naming `tmp` (GHSA-ph9p-34f9-6g65), `sharp`
      (GHSA-f88m-g3jw-g9cj) and `postcss` (GHSA-6g55-p6wh-862q and
      GHSA-r28c-9q8g-f849). `fast-uri` (GHSA-v2hh-gcrm-f6hx, via astro's
      language server) and `brace-expansion` (GHSA-mh99-v99m-4gvg, via
      `eslint-plugin-import`'s `minimatch@3`) did **not** come back - both
      upstreams have moved past the patched version, so those two overrides were
      dead weight and are dropped. Restored the three that are still
      load-bearing and re-verified: `pnpm audit --audit-level=high` exit 0,
      `pnpm install --frozen-lockfile` clean, `pnpm check:ci` exit 0,
      `pnpm check:quality` exit 0. Lockfile churn is two deleted lines. Added a
      note above the remaining overrides recording that each is load-bearing and
      how to re-check, so the next pass does not have to rediscover the method.
- [x] `dependency-cruiser`'s single repo-wide `tsConfig` left three trees exempt
      from `no-orphans` by path pattern, so any _new_ dead file in
      `packages/eslint-plugin-code-policy/src/utils/`,
      `templates/vue-app/src/types|stores/` or `templates/nuxt-app/app/types/`
      passed silently. Implemented the per-workspace fix the entry called for:
      `pnpm deps:graph:aliased` (`scripts/deps-graph-aliased.mjs`) cruises each
      aliased workspace on its own, and the repo-wide run now excludes those
      three workspaces from `no-orphans` entirely rather than suppressing
      individual files - so the per-workspace run is their sole orphan authority
      and nothing new can slip in behind a stale path pattern. The repo-wide run
      keeps every rule that genuinely needs the whole graph (`no-circular`,
      `packages-must-not-depend-on-templates`, `no-dev-dep-in-production-code`,
      `no-deprecated-core`), via a new `scope: 'repo' | 'workspace'` option on
      `createDepCruiserConfig`. Two findings worth recording. First,
      **dependency-cruiser resolves a tsconfig's relative `paths` against the
      current working directory, not against the config file that declares
      them.** For vue-app and eslint-plugin-code-policy those are the same
      directory so it happens to work; for nuxt-app, whose paths live in the
      generated `.nuxt/tsconfig.json` and are written relative to `.nuxt/`,
      every aliased import still came back `couldNotResolve` even when passed
      `--ts-config .nuxt/tsconfig.json` directly. The runner therefore generates
      a `.baseline-depcruise.tsconfig.json` per workspace with those paths
      rebased to the workspace root, and removes it in a `finally` (gitignored
      in case a crash leaves one behind). Aliases are read from each workspace's
      own tsconfig by walking its `extends` chain, not restated in the runner,
      so a template that renames an alias cannot drift from what the gate
      resolves. Second, `enhancedResolveOptions.alias` is **not** in
      dependency-cruiser's config schema (it rejects the key as an additional
      property), so passing absolute aliases - the obvious way around the cwd
      quirk - is not available; that route was tried and abandoned. Verified the
      gate actually bites, which the old suppression could not: injecting a dead
      file into all three trees produced `error no-orphans` for each
      (`src/utils/deadProbe.ts`, `src/types/DeadProbe.ts`,
      `app/types/DeadProbe.ts`), and the probes were removed afterwards.
      Confirmed nuxt-app's cruise covers the full tree including `app.vue`,
      `pages/index.vue`, `.vue` components and `server/`, with zero
      `couldNotResolve`. `app.vue` and `pages/` remain exempt as genuine Nuxt
      file-convention entry points, now via a segment-anchored pattern that
      works at either scope. `pnpm deps:graph` exit 0, `pnpm deps:graph:aliased`
      exit 0, `pnpm check:quality` exit 0, `pnpm check:ci` exit 0.
- [x] `templates/nuxt-app` failed `create-baseline --check --hard` on a missing
      `@busirocket/tsconfig` devDependency (reproduced: exit 1, the only one of
      the eight templates that failed). Took the framework-aware branch of the
      two options the entry named, because the other one is not honestly
      available: Nuxt generates `.nuxt/tsconfig.json` from `nuxt.config`'s
      typescript options and the template's `tsconfig.json` extends that, so the
      shared presets have no insertion point and re-adding the dependency would
      trip the knip unused-dependency gate exactly as it did in `d71e1dd`.
      `create-baseline` now drops `@busirocket/tsconfig` from the required list
      when the project's `tsconfig.json` extends a path inside a dot-directory -
      build output a framework regenerates, never an authored file that could
      extend a preset. Chose that shape over a hardcoded list of framework paths
      so it covers `.svelte-kit`, `.wxt` and friends without naming frameworks
      this repo does not ship. Verified with a scratch fixture that it does not
      over-fire: an authored `./tsconfig.base.json` still requires the package,
      a project with no `tsconfig.json` still requires it, a JSONC
      `tsconfig.json` (comments, unparseable as JSON) falls back to requiring it
      so an unreadable file never silently drops the requirement, and only the
      `./.nuxt/tsconfig.json` case is exempt. All eight templates now pass
      `create-baseline --check --hard`. Not done here:
      `@busirocket/create-baseline` is published at 0.2.1 and this is a behavior
      change, so it needs a release before consumers see it.
- [x] Lighthouse `NO_FCP` on `templates/vite-react-app` and
      `templates/tauri-app`. The earlier reading - "a property of those two
      templates" that headless Chrome could not measure - was wrong on both
      counts. Root cause: every template validates its environment at module
      load (`envSchema.parse(import.meta.env)` in `src/env.ts`), Vite inlines
      `VITE_*` at **build** time, and `.gitignore` ships only `.env.example`
      (`.env` and `.env.*` are ignored). So a build with no `.env` embedded
      `undefined`, `env.ts` threw before `createRoot`/`mountApp` ran, and the
      bundle painted nothing. Reproduced in a real browser (Playwright over a
      static server on `dist`): empty accessibility snapshot plus
      `ZodError: [{"expected":"string","path":["VITE_API_BASE_URL"]}]`. The same
      failure was present in `templates/vue-app`, which the old entry claimed
      measured correctly; `astro-site`, `nextjs-app` and `nuxt-app` painted only
      because they ship server-rendered markup, not because their env was valid.
      Fixed at the source rather than around the gate: new `baseline-env-init`
      bin in `@busirocket/quality-config` copies `.env.example` to `.env` when
      `.env` is absent (idempotent, no-op without an example, cross-platform),
      wired into `prepare` and `perf:check` for the six templates that ship an
      `.env.example`. Nothing new is committed - `.env` stays gitignored in
      every template, verified with `git check-ignore`. Deliberately not done:
      no `.env*` file was committed and no template `.gitignore` was relaxed,
      since a template's `.gitignore` is copied into every downstream project
      and un-ignoring an env file there would silently invite consumers to
      commit real API URLs in a public repo. Surfaced and fixed one adjacent
      gap: `.lighthouseci/` report output broke `my-nuxt-app#lint` (it lints
      `.`), so `**/.lighthouseci/**` joined the shared `globalIgnores` in
      `@busirocket/eslint-config`'s base config. `Performance budget` re-added
      to the `verify` job in `.github/workflows/ci.yml`. Verified:
      `pnpm perf:check` exit 0 with 14/14 turbo tasks (all six measurable
      templates, including the two that could not be measured before),
      `pnpm check:ci` exit 0, `pnpm check:quality` exit 0,
      `pnpm workflows:check` exit 0, and a post-fix browser snapshot of
      `vite-react-app`'s `dist` showing the real rendered content with zero
      console errors.
- [x] Root `pnpm knip` vs per-template `pnpm knip` disagreed about
      `vitest-environment-nuxt` (`templates/nuxt-app`). Task 8 declared the
      dependency in `templates/nuxt-app/package.json` because
      `app/components/TheCounter.test.ts`'s `// @vitest-environment nuxt` pragma
      genuinely needs it resolvable, and the per-template `knip.config.ts`
      correctly demanded that. The root `knip.config.ts` couldn't see that same
      usage — its `templates/nuxt-app` workspace override sets `vitest: false`
      to dodge a real `@nuxt/kit`/jiti crash in knip's vitest plugin — so it
      flagged the newly-declared dependency as unused, dropping root `pnpm knip`
      from exit 0 to exit 1. Reproduced the original crash by temporarily
      re-enabling the plugin: knip failed to load
      `templates/nuxt-app/vitest.config.ts`, unable to resolve `@nuxt/kit`,
      confirming `vitest: false` still has to stay. Resolved by adding
      `vitest-environment-nuxt` to a narrowly-scoped `ignoreDependencies` entry
      on the root config's `templates/nuxt-app` workspace override (alongside
      the existing `TEMPLATE_ESLINT_PEER_DEPENDENCIES`, with a comment
      explaining the dependency is real and only invisible because the vitest
      plugin is off there) rather than reverting the dependency or re-enabling
      the plugin. Verified: `pnpm knip` (root) exit 0,
      `pnpm -r --filter "./templates/*" knip` exit 0, `pnpm check:ci` exit 0.
- [x] `@busirocket/quality-config` was not a root `devDependency` (removed by
      Task 6 as genuinely unused at the time). Task 9 re-added it
      (`pnpm add -D -w @busirocket/quality-config@workspace:*`) and the new root
      `.dependency-cruiser.cjs` now consumes it via
      `jiti('@busirocket/quality-config/dependency-cruiser')`, giving it a real
      consumer. Because that load goes through a dynamic string argument rather
      than a static import, root `pnpm knip` still flagged it as unused; fixed
      with a scoped `ignoreDependencies` entry for the package on the `.`
      workspace in `knip.config.ts`, with a comment explaining why. Verified:
      `pnpm knip` (root) exit 0, `pnpm deps:graph` exit 0, `pnpm check:ci`
      exit 0.
- [x] `includeEntryExports` probe surfaced `bootstrap` in
      `templates/nestjs-app/src/main.ts` as an apparently-dead export. Attempted
      to drop the `export` keyword; `pnpm lint` then failed on
      `code-policy/no-hidden-top-level-declarations` (this repo's Primary Unit
      Rule, enforced via `eslint-plugin-code-policy`), which requires every
      top-level declaration to be exported so a file never carries a hidden
      internal helper. Reverted the drop. `bootstrap` is not dead code: it looks
      unused only because `src/main.ts` is a process entry point that nothing
      inside this monorepo imports as a module (same shape as
      `main.tsx`/`page.tsx` in the other templates) — the export exists to
      satisfy the template's own one-exported-unit-per-file convention, not to
      be consumed by an in-repo caller. No source change needed; documented in
      `TODO.md`'s `includeEntryExports` entry.

- [x] 2026-08-12 — **Adoption findings:** fixed the three gaps a consumer's
      adoption surfaced.
  - `tailwindcss/classnames-order` fought `prettier-plugin-tailwindcss`:
    `createTailwindConfig` now turns the rule off, with a comment explaining
    Prettier owns class ordering (same rationale style as the neighboring
    `no-custom-classname` comment).
  - Root-level config files failed the lefthook pre-commit lint with "was not
    found by the project service": `createBaseConfig` now sets
    `projectService: { allowDefaultProject: [...] }` covering
    `*.config.{ts,mjs,js}`, `eslint.config.ts` and `knip.config.ts` (globs
    capped well under typescript-eslint's 8-file match limit, none containing
    `**`). That alone traded one failure for another: the default compiler
    options behind `allowDefaultProject` don't carry the real tsconfig's module
    resolution, so a plain `import path from 'node:path'` in a config file came
    back an unresolved "error" type and `no-unsafe-*` misfired on every import —
    reproduced with a minimal probe file before touching the fix, confirming it
    wasn't specific to `@busirocket/eslint-config`'s own subpath exports. Fixed
    by adding a second config block scoped to the same globs that spreads
    `tseslint.configs.disableTypeChecked` after the typed rules block, which
    only turns off rules that require real type information. This repo's own
    root `eslint.config.ts` needed a second, repo-specific fix: `tsconfig.json`
    used to `include: ["eslint.config.ts"]` as an ad hoc workaround for this
    exact problem (added in `897675d`, before `allowDefaultProject` existed
    here), which now made the project service find the file through both paths
    at once — typescript-eslint rejects that outright ("was included by
    allowDefaultProject but also was found in the project service"). Emptied
    that `include` array with a comment pointing at the factory fix that
    replaces it.
  - The suppressions ratchet only freezes error-level violations while `lint`
    runs `--max-warnings 0`, so an adopting repo with warn-level debt can't go
    green without fixing all warnings up front or promoting rules to error.
    Documented in `docs/adoption/existing-repo.md` under a new subsection, with
    the concrete rule list that consumer had to promote
    (`code-policy/view-logic-separation`, `max-lines-per-function`,
    `max-params`, `max-depth`, `complexity`, `promise/prefer-await-to-then`,
    `promise/prefer-await-to-callbacks`, `react-refresh/only-export-components`,
    `react/no-array-index-key`, `sonarjs/no-duplicate-string`) and a note that
    the `tailwindcss/classnames-order` removal above makes that particular
    promotion historical.
  - Evidence: `packages/eslint-config` lints and type-checks clean; root
    `eslint.config.ts`/`knip.config.ts` and every template's
    `eslint.config.ts`/`knip.config.ts` lint with 0 errors (all previously
    failed with "was not found by the project service" on `knip.config.ts`, or
    would have on `eslint.config.ts` once this file's own root-tsconfig
    workaround was removed); `turbo run type-check lint:fix` across the whole
    monorepo shows only the pre-existing `tsc: command not found` failures from
    this environment's `@typescript/typescript6` alias (confirmed identical on
    an untouched `main` via `git stash`, so not a regression);
    `pnpm format:check` and `pnpm dupes` pass. `@busirocket/eslint-config`
    CHANGELOG gained an `Unreleased` entry for both fixes; no version bump (this
    repo bumps versions at release time, in a dedicated `chore(release)` commit,
    not alongside the fix).
