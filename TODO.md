# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md` (not
yet created; add it alongside the first closed entry).

## Quality gates

- [ ] `@busirocket/quality-config` is not a root `devDependency` right now.
      Task 6 (wire knip at the repo root) installed it per the task-6 brief's
      Step 1, but the root `knip.config.ts` is standalone and never imports
      from it, so `pnpm knip` correctly flagged it as an unused
      devDependency and it was removed to keep the run green. Re-add it
      (`pnpm add -D -w @busirocket/quality-config@workspace:*`) whenever a
      later task in the code-quality-gates plan adds a root-level config
      (dependency-cruiser, lefthook, type-coverage) that actually imports
      from the package — don't carry it unused in the meantime.
- [ ] `packages/eslint-config` and `packages/eslint-plugin-code-policy` have a
      real mutual runtime/dev-time dependency: `eslint-config/src/code-quality.ts`
      imports `eslint-plugin-code-policy` as a genuine rules provider, and
      `eslint-plugin-code-policy/eslint.config.ts` dogfoods
      `@busirocket/eslint-config`'s presets to lint its own source. Declaring
      the second edge as a real `workspace:*` package.json dependency (the
      "correct" fix for a knip `unlisted dependency` finding surfaced while
      wiring the root knip config in Task 6) creates a cyclic workspace
      dependency that turbo's `build` task graph refuses to run
      (`Cyclic dependency detected: eslint-plugin-code-policy#build,
      @busirocket/eslint-config#build`), breaking `pnpm check:ci`. Resolved
      for now by having `eslint-plugin-code-policy/eslint.config.ts` import
      `@busirocket/eslint-config`'s source by relative path instead of the
      package specifier (the same trick `eslint-config/eslint.config.ts`
      already uses on itself), which sidesteps the package.json edge
      entirely. If either package's self-lint setup changes and reintroduces
      a bare `@busirocket/eslint-config` import from
      `eslint-plugin-code-policy`, the cycle will come back.
- [ ] The root `knip.config.ts`'s `packages/*` entry pattern
      (`src/index.ts`, `src/*.ts`, `bin/*.mjs`) treats every top-level file in
      a package's `src/` as an entry point, because several packages
      (`eslint-config`, `quality-config`, `tsconfig`) publish one file per
      advertised sub-export rather than a single barrel. By knip's default,
      exports of entry files are not checked for dead code
      (`isIncludeEntryExports` is off), so the `exports: 'error'` rule cannot
      catch a stray dead export added to one of those files — only to
      genuinely non-entry files (e.g. anything under `src/rules/`,
      `src/utils/` in `eslint-plugin-code-policy`). Verified directly: a
      probe export added to `packages/quality-config/src/knip.ts` (an entry
      file) did not fail `pnpm knip`; the same probe added to a nested,
      non-entry file did. Turning on `isIncludeEntryExports` would catch this
      but would also flag most of the packages' real public API (anything not
      yet consumed from inside this monorepo, e.g. `createKnipConfig` before
      Task 8 wires it into templates) as unused, which needs a deliberate,
      separate tuning pass, not a Task 6 side effect.
