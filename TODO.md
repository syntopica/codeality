# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Quality gates

- [ ] cargo-baseline rule: flag sync `#[tauri::command]` functions (2026-08-20,
      found in consumer-t). Tauri runs non-async commands on the main thread, so
      any disk/DB work in them freezes the whole UI - in consumer-t a 397ms SQL
      aggregation and an 85ms versions query each froze the app on every click,
      and a sleeping external drive blocks even `stat` for seconds. consumer-t
      now enforces this with a grep gate (`check:no-sync-commands`:
      `rg '^pub fn ' src-tauri/src/commands` with an allowlist) plus a
      `commands::run_blocking` helper (`spawn_blocking` + join-error mapping)
      every command routes through. Proposed shape: cargo-baseline detects
      `#[tauri::command]` attached to a non-async `fn` and errors (allowlist
      attribute or config for genuinely in-memory commands); a deeper variant
      would flag blocking calls (rusqlite, `std::fs`, `std::net`) reachable from
      async command bodies outside `spawn_blocking`. If cargo-baseline is too
      coarse a home, a `dylint` custom lint crate is the heavier alternative;
      clippy has no native lint for this.

- [!] Three `pnpm-workspace.yaml` security overrides remain load-bearing and are
  still stopgaps: `tmp@<0.2.6` (`@lhci/cli`), `sharp@<0.35.0` and
  `postcss@<8.5.18` (both `next`). Verified 2026-08-03 by removing all five
  then-current overrides and reinstalling: those three advisories came back as
  `high`, so each still carries its own weight. Rechecked 2026-08-04, and the
  blocker moved but did not clear. `@lhci/cli` is still `0.15.1`, so the `tmp`
  entry has no newer floor at all. `next` has published `16.3.0`, which is the
  release the previous check was waiting for - but pnpm 11's release-age
  cooldown holds it back, and `pnpm update` silently reverts to `16.2.12` rather
  than failing. Forcing it with `pnpm update next@16.3.0` is worse than it
  looks: it auto-wrote **ten** entries into `minimumReleaseAgeExclude` (`next`
  plus all nine `@next/swc-*` binaries), which is exactly the supply-chain
  bypass that block's own comment forbids ("Everything else still honors the
  cooldown"). Reverted. Smallest unblock action: once `next@16.3.0` ages out of
  the cooldown, `pnpm update next -r` picks it up on its own; then remove the
  `sharp` and `postcss` entries, run
  `pnpm install && pnpm audit --audit-level=high`, and drop whichever advisory
  does not return.

- [ ] Two advisories sit below the `--audit-level=high` gate and are
      deliberately not overridden: `uuid@<11.1.1` (moderate,
      GHSA-w5hq-g745-h8pq, via `@lhci/cli > uuid` in six templates -
      `astro-site`, `nextjs-app`, `nuxt-app`, `tauri-app`, `vite-react-app`,
      `vue-app`) and `esbuild >=0.27.3 <0.28.1` (low, GHSA-g7r4-m6w7-qqqr, via
      `packages/eslint-plugin-code-policy > tsup > esbuild` and
      `> vitest > vite > esbuild`). The `overrides:` block in
      `pnpm-workspace.yaml` is scoped by its own comment to `high` findings, so
      forcing these would contradict the stated policy and pin two more
      transitive edges for no gate benefit. Both paths were re-measured
      2026-08-04: the esbuild finding no longer reaches through
      `@vitest/eslint-plugin` - bumping that to `1.6.26` removed the edge - and
      what remains is `eslint-plugin-code-policy`'s own build and test
      toolchain. Expected to clear when Renovate bumps `@lhci/cli`, `tsup` and
      `vitest`; revisit only if either advisory is re-scored `high`, which would
      make it a gate failure and move it into the entry above.

- [ ] `pnpm check:quality` failed once on a cold run and passed on every run
      after, with the same tree and no intervening change. Not isolated: the
      chain ends in `publish:check`, whose Turbo task depends on `^build` and
      `build`, so a cold invocation builds every template first - the same area
      as the already-recorded Turbo race. Smallest next step: reproduce with
      `pnpm exec turbo run publish:check --force` from a cleared cache and
      capture which task fails, rather than the aggregate exit code.

## Testing gaps (2026-08-24)

Found auditing why test files obeyed no norm. The lint side is fixed (test files
now carry a 200-line budget and `file-kind-placement`); these are the rest.

- [ ] **Every template declares 80% coverage thresholds that are never
      measured.** The seven `vitest.config.ts` files with
      `thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }`
      are dead configuration: the script is `test: "vitest run"` with no
      `--coverage`, and `check:ci` calls `pnpm test`. `turbo.json` even declares
      `outputs: ["coverage/**"]` for the `test` task, and CI logs
      `no output files found for task ...#test` because nothing produces it.
      `templates/nestjs-app` and `packages/eslint-plugin-code-policy` declare no
      thresholds at all. Smallest step: decide whether coverage is a gate, then
      either add `--coverage` to the `test` script in every template or delete
      the thresholds and the turbo `outputs` key.
- [ ] **`cargo test` never runs in CI.** `packages/cargo-baseline` has no
      `package.json`, so it is not a pnpm workspace member and `turbo run test`
      skips it; `.github/workflows/ci.yml` has no cargo step either. That leaves
      ~2.100 lines of Rust with inline `#[cfg(test)]` suites unexecuted on every
      push. Smallest step: add a cargo job to `ci.yml` running
      `cargo test --workspace`.
- [ ] **Rust and TypeScript disagree on whether tests cost file budget.**
      `max_file_lines` (`packages/cargo-baseline/src/rules/max_file_lines.rs`)
      exempts only the `tests` path component and counts the lines of an inline
      `#[cfg(test)] mod tests` block against the file's budget, while a TS test
      file now gets its own 200-line budget. A Rust file pays for its tests; a
      TS one does not. Decide which is intended and align. Related to the
      consumer-t file-level test-module finding below.
- [ ] **`jscpd` misses short duplicated test scaffolding.** `minTokens: 70` in
      `.jscpd.json` is tuned for production code; a `beforeEach` or fixture
      block copied across suites is typically well under 70 tokens and never
      reported. Test duplication is otherwise gated (tests are scanned on
      purpose, currently 0% across 46 TS files). Smallest step: measure what a
      second jscpd pass scoped to test globs with a lower `minTokens` would
      report before deciding whether the noise is worth it.
- [ ] **`packages/eslint-plugin-code-policy` still casts its rules to hand them
      to `RuleTester`.** `tests/rule-testers/runRuleTest.ts` absorbs the cast
      once (it used to be repeated in all ten suites), but the cast exists only
      because ESLint core's `RuleTester` types its rule parameter as the untyped
      `RuleDefinition` shape. `@typescript-eslint/rule-tester` is the
      maintained, flat-config-native tester typed for the `RuleModule` shape
      `createRule()` produces, and would remove it. Smallest step: swap the
      devDependency and delete the two cast type aliases.

## Adoption findings (consumer-x, 2026-08-19)

- [ ] **Fresh adoption of the nextjs-app template breaks on `next build`: the
      template's `next` range `^16.2.12` resolves to 16.3.1 outside the monorepo
      lockfile, and Next 16.3.1 rejects the aliased `typescript` package**
      (`npm:@typescript/typescript6`) — build dies with "It looks like you're
      trying to use TypeScript but do not have the required package(s)
      installed" even though `require.resolve('typescript')` works. Reproduced
      and worked around in `pixel-potion/consumer-x` by pinning `next`,
      `eslint-config-next` and `@next/eslint-plugin-next` to exactly 16.2.12.
      Smallest step: pin the template's Next deps exactly (or test the alias
      against 16.3.x and record the supported ceiling).
- [ ] **`docs/adoption/new-repo.md` never mentions the pnpm 11 build-script
      allowlist.** A fresh repo fails `pnpm install` with
      `ERR_PNPM_IGNORED_BUILDS` (lefthook, unrs-resolver, sharp), and the
      `pnpm.onlyBuiltDependencies` package.json field the error suggests is
      ignored by pnpm 11 — the working form is `allowBuilds:` in
      `pnpm-workspace.yaml`, as this monorepo already uses. Add the snippet to
      the adoption doc (observed bootstrapping `pixel-potion/consumer-x`,
      2026-08-19).

## Adoption findings (consumer-t, 2026-08-13)

- [ ] **`cargo-baseline` does not recognize file-level test modules, only inline
      `#[cfg(test)] mod x { ... }` blocks and `tests/` path components.** A
      module declared as `#[cfg(test)] mod tests;` in a parent `mod.rs` (content
      in `tests.rs`), or a file using the `#![cfg(test)]` inner attribute, is
      scanned as production code: `no-inline-sql` flags test-fixture SQL and
      `max-file-lines` counts the file (its exemption is the `tests` path
      component; `no-inline-sql` has no path exemption at all). This forces
      consumers into the `tests/mod.rs` + inner wrapper module layout — which
      clippy's `module_inception` then flags when the wrapper is also named
      `tests` (consumer-t worked around it by naming the wrapper `suite`). Fix in
      the engine: treat `#![cfg(test)]` files and cfg-test outer `mod`
      declarations as test scope (e.g. in `is_cfg_test_item` callers /
      `FileContext`), or give `no-inline-sql` the same `tests`-path exemption.
      Evidence: consumer-t clippy burn-down session 2026-08-13,
      `pnpm lint:rust:baseline` runs against `src-tauri/src/db/queries/tests.rs`
      (19 errors flattened, 0 after restoring the wrapper layout).

- [ ] **`createKnipConfig` ships stale ignore entries that knip itself flags as
      configuration hints.** In consumer-t (tauri framework), `pnpm knip` prints
      six persistent hints against the factory's own config:
      `@vitest/eslint-plugin`, `eslint-config-prettier`, and
      `eslint-plugin-testing-library` ("Remove from ignoreDependencies"),
      `turbo` and `lhci` ("Remove from ignoreBinaries"), plus an informational
      `.css` compiled-extension note. The first five live in
      `@busirocket/quality-config`'s knip factory (`src/knip.ts`) and should be
      pruned or made per-framework there; consumers cannot silence them without
      overriding the factory. Evidence: consumer-t `pnpm knip` output, 2026-08-13
      (gate passes; hints only).

## Adoption findings (consumer-y, 2026-08-04)

Found while adopting eslint-config 0.6.0 + quality-config 0.3.0 in an existing
Next.js + drizzle + zod monorepo (3.291 TypeScript files, six workspaces).

- [ ] **knip reports a drizzle schema aggregator's exports as dead, and acting
      on the report emits `DROP TABLE`.** `drizzle.config.ts` names one file as
      THE schema (`schema: './src/schema/schema.ts'`); every export there is a
      live table, and most are not imported by any TypeScript file, so knip
      flags them. Deleting one makes the next generated migration drop the
      table. This is the highest-consequence false positive the gate can produce
      and `quality-gates.md` does not mention it. Smallest fix: document it in
      the knip section, and consider having `createKnipConfig` accept the
      drizzle schema path and ignore it.

- [ ] **The atomic-file rules fight the standard zod idiom, and the fight is
      unwinnable per file.** `export const fooSchema = z.object(...)` plus
      `export type Foo = z.infer<typeof fooSchema>` trips BOTH
      `code-policy/one-primary-unit` and
      `code-policy/no-inline-types-in-runtime-files`. In consumer-y that was
      **158 of 296** atomic-file findings, and the whole `contracts` package
      (116 findings) is exactly this shape. The type cannot move to its own file
      without importing the schema back, so splitting produces a two-line file
      per schema and no separation at all. Same for a drizzle table and the row
      types derived from it. Smallest fix: exempt a type alias whose initializer
      is `z.infer<typeof X>` (or drizzle's `$inferSelect` / `$inferInsert`)
      where `X` is declared in the same file - the type is the schema's
      signature, not a second unit. Until then every zod codebase writes the
      same `files:`/`rules:` override by hand.

- [ ] **A delivered-but-unconsumed package reads as 100% dead code.**
      `createKnipConfig` sets `includeEntryExports: true`, so a package no app
      imports yet (consumer-y's VERI*FACTU core: finished, not wired) reports
      its entire public API as unused exports. Per-workspace
      `includeEntryExports: false` is the fix and it works, but nothing in the
      README or `quality-gates.md` says so, and the obvious reading of the
      report is "delete this package".

- [ ] **knip's drizzle plugin makes the gate need a live database.** It loads
      `drizzle.config.ts`, which by design throws when `DATABASE_URL` is unset,
      so `pnpm knip` fails in CI with
      `ERROR: Error loading packages/db/drizzle.config.ts`. Adding the file to
      the workspace's `ignore` does NOT stop the plugin - only `drizzle: false`
      does. Worth a line in the knip section.

- [ ] **`ignoreBinaries: ['turbo', 'lhci']` is wrong for a consumer that depends
      on turbo.** The preset ships it, and knip then emits
      `turbo ... Remove from ignoreBinaries` as a configuration hint on a clean
      repo. A consumer either lives with a permanent hint or restates the whole
      option. Consider dropping both from the shared preset and keeping them in
      the templates that need them.

- [ ] **`createDepCruiserConfig` at repo scope is unusable in a monorepo with no
      root `tsconfig.json`.** Each workspace resolves `@/*` through its own
      config, so a repo-wide cruise cannot resolve any alias and `no-orphans`
      reports whatever it could not follow. The baseline solves this in its own
      repo with `scripts/deps-graph-aliased.mjs`, which is NOT part of
      `quality-config` - so every consumer has to rewrite it. Ship it, or ship a
      `baseline-deps-graph` bin that cruises each workspace with its own
      tsconfig. consumer-y skipped dependency-cruiser entirely for this reason;
      `import/no-cycle` at full depth plus knip's `files` rule already cover its
      two useful rules.

- [ ] **`type-coverage` has no runner either.** `quality-config` exports the
      threshold constant and nothing else, so each consumer writes its own
      per-workspace loop (consumer-y copied `scripts/type-coverage.mjs` from
      this repo and edited the workspace globs). Same fix as above: a bin.

- [ ] **The adoption guide understates the cost for a repo with partial
      coverage.** `docs/adoption/existing-repo.md` assumes one ESLint entry
      point. consumer-y had a config in `apps/web` only, so five workspaces
      (3.291 files total, ~800 of them unlinted) had never been linted at all;
      turning the baseline on there produced 1.118 findings that no
      `--suppress-all` decision had ever been taken about. Worth naming as its
      own step: inventory which workspaces have NO config before estimating.

## Repo hygiene

- [ ] The three tags cut on 2026-08-04 (`eslint-config@0.6.0`,
      `quality-config@0.3.0`, `create-baseline@0.3.2`) are **lightweight**,
      while every tag before them is annotated (`git cat-file -t` returns `tag`
      for `eslint-config@0.5.0` and `commit` for these). They are already
      pushed, and a release tag is immutable, so they stay as they are. The
      thing to fix is the next release: create tags with `git tag -a -m`, or
      have `brp-release` do it, so the history stops mixing both kinds.

## CI (from the 2026-08-17 mailbox pass)

- [ ] `CI` has been red on `main` since at least 2026-08-12: the three most
      recent runs all failed (`gh run list -R BusiRocket/baseline --limit 3`,
      checked 2026-08-17; newest 2026-08-13T11:24Z), and four "Run failed"
      notices in the mailbox name the security gates as the failing step.
      Source: `~/p/TODO.md`, 2026-08-17 mailbox pass.
