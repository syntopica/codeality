# @busirocket/quality-config

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
