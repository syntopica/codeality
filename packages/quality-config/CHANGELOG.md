# @busirocket/quality-config

## 0.11.0

### Minor Changes

- feat: `baseline-audit` - advisory waivers that expire.

  `pnpm audit --audit-level=high` has one lever, and silencing a judged finding
  means raising it for everything. `baseline-audit` reads
  `.baseline-advisories.json`, keyed by GitHub advisory id, where each entry
  carries a required `reason` and a required `expires`. An expired waiver fails
  the build; an entry missing either field is rejected rather than honoured.
  Because a judged finding now has somewhere to live, the default gate is
  `moderate` rather than `high` - strictly stricter than before.

- feat: `baseline-licenses` - a licence gate for published packages.

  Walks one package's _production_ closure and asserts every licence is
  permissive, with the same `reason`/`expires` allowlist shape. Dev dependencies
  are excluded on purpose: a copyleft test runner is not distributed, a copyleft
  transitive runtime dependency of an MIT package is. `pnpm licenses list` is
  not usable here - inside a workspace it reports the whole store, 986 packages
  for a config package with eight direct dependencies.

- feat: `/commitlint` - conventional-commit rules for the `commit-msg` hook.

  The release tooling already derived the semver bump and the changelog from
  commit subjects, so a subject typed `feature:` instead of `feat:` silently
  dropped a change out of the release notes. Nothing verified it. Two rules from
  the conventional preset are off because they fight how commits are written
  here: `body-max-line-length` rejects a pasted stack trace, `subject-case`
  rejects a subject starting with `TypeScript` or `GitHub`.

- feat: `/oxlint` - a pre-filter config, one category wide.

  `correctness` only. That is the set whose findings ESLint would also reject,
  so oxlint can fail a build in seconds without introducing a second opinion.
  Measured on this repository: `correctness` reported nothing, `suspicious` and
  `pedantic` reported 19 findings, none of which ESLint considers a problem. See
  `OXLINT.md` for why the scope is not wider.

- feat: `createLefthookConfig()` gains a `commit-msg` hook and a `lint:fast`
  pre-commit command.

  The typed lint stays the authority; the two-second pass runs first.

## 0.10.0

### Minor Changes

- fix: `baseline-type-coverage` measured nothing on a solution-style
  `tsconfig.json` and reported `ok`.

  A root `{"files": [], "references": [...]}` contributes no source of its own,
  so type-coverage measured 0 identifiers and exited 0 -- a green gate over an
  entire repository. consumer-g reported `ok  .  0 / 0` and had to keep a
  hand-written runner. Solution configs now contribute their referenced projects
  instead, each measured with `-p`: the same tree reports 194,942 / 195,652,
  41,214 / 41,415 and 184,008 / 184,671.

- fix: discovery descended into gitignored directories.

  consumer-g's `artifacts/bamboobox-findings`, a vendored tree deliberately
  excluded from its root quality scans, was reported as a checked workspace.
  Candidate directories are now put to `git check-ignore` in one pass; a repo
  without git excludes nothing, as before.

- feat: `--ignore-files <glob>`, repeatable, merged with the two built-in
  exclusions.

  For generated or vendored code a project already excludes elsewhere -- a
  migrations directory is the standing case, and it is why consumer-y kept its
  own runner. Not a way to hide `any`s: it adds to the built-in list and cannot
  replace it.

## 0.9.0

### Minor Changes

- feat: `tanstack-start` knip preset.

  TanStack Start has no `index.html` and no `src/main.tsx`: the router is the
  root of the graph and the framework generates `routeTree.gen.ts` from
  file-based routes. Adopting consumer-h under the `vite-react` preset left two
  permanent "Refine entry pattern (no matches)" hints and reached the graph only
  by accident.

## 0.8.1

### Patch Changes

- fix: `createKnipConfig` returns `KnipConfiguration`, not `KnipConfig`.

  `KnipConfig` is a union that also admits a function, so a project spreading
  the factory's result to override one rule got
  `Property 'rules' does not exist on type 'RawConfigurationOrFn'` and had to
  cast the value first. Consumer-ab and consumer-m both hit it.
  Returning the object shape makes extending the config the ordinary thing it
  looks like.

## 0.8.0

### Minor Changes

- feat: `createKnipConfig` accepts `project` and `entry` globs, merged with the
  framework preset.

  Every preset assumes the framework's own layout -- for Next.js, `src/` and
  `app/`. consumer-m predates that convention: `actions/`,
  `components/`, `hooks/`, `services/`, `types/` and six more sit at the repo
  root, so knip saw only `app/` and reported 34 live dependencies as unused. The
  factory had no override, so a repo in that shape could either delete the gate
  or carry a permanent 34-line false report.

  Both options merge rather than replace: a project can tell knip where its
  extra code lives, but cannot silently stop it scanning the directories the
  framework does own.

## 0.7.0

### Minor Changes

- feat: `baseline-type-coverage --at-least <n>` freezes a repo below the shared
  threshold.

  The bar is 99% and the runner had no way to say otherwise, so a codebase that
  measures 96.93% could not wire this gate at all: the choice was an unenforced
  gate or none. Found adopting capture-service, whose 25 uncovered expressions sit
  almost entirely in one database row mapper -- a real boundary, not sloppiness.

  Freezing at the measured value makes coverage a ratchet: it cannot fall, and
  the number in `package.json` is the debt, visible in every diff that changes
  it. The flag refuses a value above the shared threshold, so it can only ever
  lower the bar for a project that needs it, never restate or raise it.

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
