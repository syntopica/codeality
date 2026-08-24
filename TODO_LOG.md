# TODO Log

Closed work from `TODO.md`, grouped by year and month.

## 2026-08

- [x] 2026-08-24 - **Adoption backlog cleared:** the twelve findings that three
      real adoptions (consumer-y, consumer-t, consumer-x) left open.
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
      standard in `BusiRocket/busirocket` (Next.js 16, ESLint 10.8) exposed.
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
    `BusiRocket/busirocket` is on `^0.4.0` with its local patches deleted and
    both gates green, which is the acceptance test passing for real rather than
    against a working copy.
  - Evidence: the new patterns were unit-checked against 13 real busirocket
    paths (route files, nested routes, metadata routes, `src/proxy.ts`, and the
    near-misses `app/blog/mypage.tsx` and `src/lib/route.ts`),
    `pnpm check:quality` passes here, and busirocket passes `knip` and
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
      consumers crash - the patch is what made this a report from
      `capture-service` rather than a failing gate here. `createNextjsConfig` and
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

- [x] 2026-08-12 — **Adoption findings (consumer-t):** fixed the three gaps
      consumer-t's adoption surfaced.
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
    the concrete rule list consumer-t had to promote
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
