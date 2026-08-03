# @busirocket/quality-config

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
