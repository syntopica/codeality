# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Adoption findings (consumer-t, 2026-08-12)

- [ ] `tailwindcss/classnames-order` (createTailwindConfig) fights the
      `prettier-plugin-tailwindcss` sorter shipped in
      `@busirocket/prettier-config/frontend`: eslint --fix orders classes one
      way, prettier --write reorders them the other, so a repo running both can
      never pass `lint` and `format:check` together. Verified on consumer-t (111
      order warnings reappeared after each prettier pass). Pick one owner -
      likely disable the eslint rule in the factory since the prettier plugin is
      the official sorter.

- [ ] Root config files (`eslint.config.ts`, `knip.config.ts`) fail the lefthook
      pre-commit lint: `createBaseConfig` sets `projectService: true` with no
      `allowDefaultProject`, and template tsconfigs include only `src`, so any
      commit touching them dies with "was not found by the project service".
      consumer-t worked around it by ignoring `*.config.{ts,mjs,js}` in its
      eslint ignores.

- [ ] The suppressions ratchet only freezes error-level violations, but the
      baseline ships several rules at warn severity while `lint` runs
      `--max-warnings 0`. An adopting repo with existing warn-level debt can
      never go green without either fixing all warnings up front or promoting
      those rules to error (what consumer-t did). Either change the factory
      severities or document the promotion step in
      docs/adoption/existing-repo.md.

## Quality gates

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
