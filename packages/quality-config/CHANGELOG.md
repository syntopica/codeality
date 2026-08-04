# @busirocket/quality-config

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
