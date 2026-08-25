# @busirocket/quality-config

## 0.6.1

### Patch Changes

- fix: `createKnipConfig` ignores every tool this package's runners spawn.

  `baseline-dupes` spawns `jscpd`, `baseline-type-coverage` spawns
  `type-coverage`, `baseline-deps-graph` spawns `depcruise` - all through
  `pnpm exec`, so a project that wires the runner into its scripts never names
  the underlying tool anywhere knip can see and knip reports a real dependency
  as unused. Only `jscpd` was on the list; found in busirocket the moment its
  `type-coverage` script became `baseline-type-coverage` and `pnpm knip` went
  red on a dependency it uses on every run.

  `dependency-cruiser` is included even though a project calling `depcruise`
  directly resolves it fine: there knip emits a `Remove from ignoreDependencies`
  hint, which is a hint and not a gate failure, and the cost of leaving it off
  is a real dependency silently reported as dead.

## 0.6.0

### Minor Changes

- feat: `baseline-dupes --also-ignore` adds ignore patterns on top of the shared
  list.

  jscpd's own `--ignore` replaces the config's list rather than merging into it.
  Measured on this repo: a config that also ignored `**/cargo-baseline/**`
  scanned 61 files and found 1 clone; adding an unrelated `--ignore` took it to
  109 files and 4 clones, the shared patterns gone.

  That left a project with one generated directory to exclude - committed
  Supabase types, a migrations folder, a cpanel build - restating every shared
  pattern in its own `package.json`, which is the duplication this runner exists
  to remove. Five of the nine repos surveyed carried exactly such an entry.
  `--also-ignore` merges through a generated config that is deleted again on the
  way out, and extends a caller-supplied `--config` when there is one.

### Patch Changes

- fix: `baseline-dupes` no longer mistakes a flag's value for a scan path.

  It split arguments into paths and flags on a leading `-`, which cannot work:
  `--min-tokens 120` and `--config x.json` carry a value that looks like
  neither, so `120` was handed to jscpd as a directory to scan and a `--config`
  value shifted the flag list, silently dropping the flag after it. Arguments
  are now forwarded in the order given, untouched apart from `--also-ignore`;
  the only argument the runner adds is `--config`, and only when the caller did
  not pass one.

## 0.5.0

### Minor Changes

- feat: the jscpd gate ships from here, as `jscpd.json` plus a `baseline-dupes`
  runner.

  `.jscpd.json` was copied byte for byte into the repo root and all eight
  templates, and every adopting project had to copy it again - the only quality
  gate in the set that was hand-maintained duplication rather than shared
  config. It is now one file in this package, read in place.

  jscpd 5.x is a Rust binary that reads JSON only, with no JS config loader, so
  this gate cannot be a factory the way `createKnipConfig` is. `baseline-dupes`
  points jscpd at the packaged config and forwards any extra flag, which wins
  over the file. The config is also resolvable directly, as
  `@busirocket/quality-config/jscpd`.

  `jscpd` stays a devDependency of the consuming project; the runner invokes it
  rather than vendoring it.

- feat: `createKnipConfig` takes options instead of forcing every consumer to
  restate the preset.

  `ignoreBinaries`, `ignoreDependencies`, `ignore`, `includeEntryExports` and
  `drizzle` are now settable. `ignoreDependencies` merges with the ESLint peer
  list rather than replacing it, so a consumer whose layout hides a caller adds
  one entry instead of copying the whole array.

  The four cases that drove this, all found adopting the baseline in real repos:

  - A **drizzle schema aggregator** reports every table as a dead export,
    because `drizzle.config.ts` is the only consumer. Acting on that report
    makes the next generated migration emit `DROP TABLE`. `ignore` excludes the
    file.
  - knip's **drizzle plugin loads `drizzle.config.ts`**, which throws by design
    without `DATABASE_URL`, so the gate needed a live database in CI. Adding the
    file to `ignore` does not stop the plugin; `drizzle: false` does.
  - A **package that is finished but not wired up** reports its entire public
    API as unused under `includeEntryExports: true`, and the obvious reading is
    "delete this package". It can now be set per workspace.
  - `ignoreBinaries` **no longer defaults to `['turbo', 'lhci']`**. Both resolve
    in every template that has them, so the entries only ever produced a
    `Remove from ignoreBinaries` hint a consumer could not silence.

- feat: ship the two runners consumers were copying by hand.

  `baseline-type-coverage` runs `type-coverage --strict` in every workspace with
  a `tsconfig.json`, reading the threshold from the package's own
  `TYPE_COVERAGE_THRESHOLD` so the constant and the gate cannot drift. The
  package exported that number and nothing else, so each consumer wrote its own
  per-workspace loop.

  `baseline-deps-graph` cruises each workspace with that workspace's own
  tsconfig. A single repo-wide cruise takes one `tsConfig`, so in a monorepo it
  resolves at most one `@/*` mapping and `no-orphans` then reports everything it
  could not follow - which is why one adopter dropped dependency-cruiser
  entirely.

### Patch Changes

- fix: drop `@vitest/eslint-plugin` and `eslint-plugin-testing-library` from the
  shared `ignoreDependencies` list.

  knip resolved the real caller for both in all eight templates, so the entries
  were redundant everywhere while still printing a hint.
  `eslint-config-prettier` and the rest stay: they are redundant in four of the
  eight layouts and load-bearing in the other four, which is what the list is
  for. Template hints went from 21 to 5.

## 0.4.0

### Minor Changes

- fix: complete the Next.js file conventions in both knip and
  dependency-cruiser.

  Adopting the standard in a real Next.js 16 project surfaced two presets that
  had fallen behind the framework.

  `createKnipConfig({ framework: 'nextjs' })` listed `middleware.ts`, which Next
  16 renamed to `proxy.ts`. In a project that followed the rename, the proxy was
  reachable from no entry point, so knip reported it and everything only it
  imports as **unused files** while the pattern that no longer matched anything
  produced a `Refine entry pattern (no matches)` hint. The entry now reads
  `{,src/}{middleware,proxy}.ts` - one pattern, because a project has one file
  or the other - and the App Router metadata routes (`sitemap`, `robots`,
  `manifest`, `icon`, `apple-icon`, `opengraph-image`, `twitter-image`) plus
  `global-error` join the existing brace alternation for the same reason.

  `createDepCruiserConfig`'s `no-orphans` exemptions covered `sitemap` and
  `robots` and nothing else of the App Router, so a normal project reported one
  orphan error per route file. Every convention is exempt now, at any depth
  below `app/`, and so is `middleware`/`proxy`.

  The exemptions are written as two patterns - a direct-child form and a nested
  `.*/` form - rather than one with an optional `(.*/)?` directory group,
  because dependency-cruiser runs every `pathNot` entry through safe-regex and
  **abandons the entire rule** when one is rejected, rather than skipping that
  pattern. A nested quantifier there does not narrow the orphan check, it turns
  it off. That trap is now documented in the factory and in
  `docs/standards/quality-gates.md`.

  A Next.js consumer on 0.3.0 that had patched around either gap can delete
  those local patches; a consumer that had not will see false findings
  disappear, so this is a behavior change rather than a patch.

## 0.3.0

### Minor Changes

- fix: cover the `src/app` layout in the knip Next.js preset. (`361dbf3`)

  `createKnipConfig({ framework: 'nextjs' })` rooted its entry globs at `app/`,
  so a project using `src/app/` matched none of them. The consequence is not a
  quiet pass: with no entry matching, knip reports the application's own route
  files as **unused files** and never checks their exports.

  The globs now carry both roots in one pattern
  (`{,src/}app/**/{page,layout,...}.{ts,tsx}`, `{,src/}middleware.ts`), which
  also means neither layout produces a `Refine entry pattern (no matches)` hint.
  `next.config.*` stays root-only, where Next.js requires it.

  A `src/app` project on 0.2.0 that adopts this will see its knip output
  change - the false "unused files" disappear and real dead exports start
  failing the gate - so this is a behavior change, not a patch.

## 0.2.0

### Minor Changes

- feat: check entry-file exports in `createKnipConfig`.

  The generated config now sets `includeEntryExports: true`, so a dead export
  added to a project's entry file (`src/main.ts`, `src/index.ts`) fails the gate
  instead of passing silently. It also sets `ignoreExportsUsedInFile: true`,
  which is the pairing the Primary Unit Rule requires: a top-level declaration
  may not be hidden, so an entry-point helper a file uses only itself still has
  to be exported. An export nothing references at all still fails.

  A project on 0.1.0 that adopts this may start failing `knip` - that is the
  ratchet working, but it is a behavior change, not a patch.

  Coverage is real but partial: it does not reach files a knip framework plugin
  registers as an entry of its own (a Next.js `page.tsx`, a Vite `main.tsx`
  loaded from `index.html`).

- feat: drop `src/app/index.ts` from the `vite-vue` entry list.

  It was there to work around knip not resolving a path-aliased bare `@/app` to
  the directory's `index.ts`. A Vue project should import its composition root
  as `@/app/index` explicitly instead; the extra entry made knip refuse to count
  the entry-to-entry import as usage.

## 0.1.0

### Minor Changes

- feat: initial release. Shared configuration factories for the cross-file
  quality gates, plus one executable.

  - `createKnipConfig` (`/knip`) - unused files, exports and dependencies, with
    per-framework entry globs.
  - `createDepCruiserConfig` (`/dependency-cruiser`) - import cycles, orphan
    modules, package/template boundary, devDependency-in-production, and
    deprecated Node core modules. Takes `scope` (`'repo'` for the whole graph,
    `'workspace'` for a single-workspace orphan check), `tsConfigPath`, and
    `orphanExemptions` for project-specific exemptions. The factory itself
    encodes no directory name belonging to any particular repository.
  - `TYPE_COVERAGE_THRESHOLD` (`/type-coverage`) - minimum non-`any` coverage.
  - `createLefthookConfig` (`/lefthook`) - shared git hook pipeline.
  - `baseline-env-init` - seeds a gitignored `.env` from the committed
    `.env.example`, so a freshly cloned project boots on the documented example
    values rather than failing its startup env validation. Bundlers inline
    `VITE_*`/`NEXT_PUBLIC_*` at build time, so without it a project with no
    `.env` builds a bundle that throws before it renders and shows a blank page
    rather than a useful error. Idempotent, and a no-op without an
    `.env.example`.

  Every export resolves to TypeScript source; consumers load it with ESM and a
  TypeScript-aware runner such as `jiti`. `knip` and `dependency-cruiser` are
  optional peers, needed only for the gates you actually use.
