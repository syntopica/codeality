# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md` (not
yet created; add it alongside the first closed entry).

## Quality gates

- [ ] `@busirocket/quality-config` is not a root `devDependency` right now. Task
      6 (wire knip at the repo root) installed it per the task-6 brief's Step 1,
      but the root `knip.config.ts` is standalone and never imports from it, so
      `pnpm knip` correctly flagged it as an unused devDependency and it was
      removed to keep the run green. Re-add it
      (`pnpm add -D -w @busirocket/quality-config@workspace:*`) whenever a later
      task in the code-quality-gates plan adds a root-level config
      (dependency-cruiser, lefthook, type-coverage) that actually imports from
      the package — don't carry it unused in the meantime.
- [ ] `packages/eslint-config` and `packages/eslint-plugin-code-policy` have a
      real mutual runtime/dev-time dependency:
      `eslint-config/src/code-quality.ts` imports `eslint-plugin-code-policy` as
      a genuine rules provider, and `eslint-plugin-code-policy/eslint.config.ts`
      dogfoods `@busirocket/eslint-config`'s presets to lint its own source.
      Declaring the second edge as a real `workspace:*` package.json dependency
      (the "correct" fix for a knip `unlisted dependency` finding surfaced while
      wiring the root knip config in Task 6) creates a cyclic workspace
      dependency that turbo's `build` task graph refuses to run
      (`Cyclic dependency detected: eslint-plugin-code-policy#build,     @busirocket/eslint-config#build`),
      breaking `pnpm check:ci`. Resolved for now by having
      `eslint-plugin-code-policy/eslint.config.ts` import
      `@busirocket/eslint-config`'s source by relative path instead of the
      package specifier (the same trick `eslint-config/eslint.config.ts` already
      uses on itself), which sidesteps the package.json edge entirely. If either
      package's self-lint setup changes and reintroduces a bare
      `@busirocket/eslint-config` import from `eslint-plugin-code-policy`, the
      cycle will come back.
- [ ] The root `knip.config.ts`'s `packages/*` entry pattern (`src/index.ts`,
      `src/*.ts`, `bin/*.mjs`) treats every top-level file in a package's `src/`
      as an entry point, because several packages (`eslint-config`,
      `quality-config`, `tsconfig`) publish one file per advertised sub-export
      rather than a single barrel. By knip's default, exports of entry files are
      not checked for dead code (`isIncludeEntryExports` is off), so the
      `exports: 'error'` rule cannot catch a stray dead export added to one of
      those files — only to genuinely non-entry files (e.g. anything under
      `src/rules/`, `src/utils/` in `eslint-plugin-code-policy`). Verified
      directly: a probe export added to `packages/quality-config/src/knip.ts`
      (an entry file) did not fail `pnpm knip`; the same probe added to a
      nested, non-entry file did. Turning on `isIncludeEntryExports` would catch
      this but would also flag most of the packages' real public API (anything
      not yet consumed from inside this monorepo, e.g. `createKnipConfig` before
      Task 8 wires it into templates) as unused, which needs a deliberate,
      separate tuning pass, not a Task 6 side effect.
- [ ] Task 8 evaluated `includeEntryExports` for the per-template knip configs
      (`packages/quality-config/src/knip.ts`) and left it off, by evidence, not
      by omission. Tested with `--include-entry-exports` across all eight
      templates: six report zero findings either way. `nestjs-app` surfaces one
      genuine dead export (`bootstrap` in `src/main.ts`, exported but only ever
      called in the same file via `void bootstrap()` — the `export` keyword
      serves no purpose). `vue-app` surfaces a false positive: `mountApp`
      (re-exported from `src/app/index.ts`, genuinely consumed by
      `src/main.ts`'s `import { mountApp } from '@/app'`) gets flagged because
      `src/app/index.ts` had to be added to the `vite-vue` entry list in the
      same task to fix an unrelated graph-traversal bug (knip doesn't resolve a
      path-aliased bare specifier to a directory's `index.ts`), and knip does
      not count an import from one entry file into another entry file as usage
      once `isIncludeEntryExports` is on. `includeEntryExports` is a single
      global boolean with no per-entry-pattern override (confirmed against
      knip's docs), so it cannot be enabled for `main.tsx`/`page.tsx` while
      excluded for the `src/app/index.ts` workaround. Turning it on today would
      fail `pnpm check:ci` for both templates, and the only fixes are
      template-source changes (drop `export` from `bootstrap`; restructure
      `vue-app`'s composition-root import) that Task 8 was told not to make just
      to satisfy knip. Revisit together with template-source ownership: drop the
      stray `export` on `nestjs-app`'s `bootstrap`, resolve `vue-app`'s
      barrel/alias pattern, then re-run the same `--include-entry-exports` probe
      on all eight templates before flipping the default on.
- [ ] Task 8 added `vitest-environment-nuxt` to
      `templates/nuxt-app/package.json` devDependencies — a genuine fix:
      `app/components/TheCounter.test.ts` has a `// @vitest-environment nuxt`
      pragma, which needs that package resolvable from the project, and it was
      not declared (pnpm phantom dependency, only working by transitive luck
      through `@nuxt/test-utils`). The per-template `pnpm knip` gate this task
      added correctly flagged it as `Unlisted dependencies` and now passes with
      it declared. Side effect: the repo-root `pnpm knip` (`knip.config.ts` at
      the repo root, not part of `pnpm check:ci`) now reports it as an
      `Unused devDependency` instead, because that config's `templates/nuxt-app`
      workspace override sets `vitest: false` (disabling knip's vitest plugin
      there to dodge an unrelated `@nuxt/kit`/jiti resolution crash — see the
      root `knip.config.ts` comment), so the root config never sees the pragma
      that makes the dependency used. Root `pnpm knip` went from exit 0 to exit
      1 because of this one finding (verified: identical otherwise, diffed
      against the pre-Task-8 baseline). Declaring the dependency is the correct
      fix and Task 8 was told not to touch the root `knip.config.ts`, so this is
      left for whoever owns that file next: add `vitest-environment-nuxt` to an
      `ignoreDependencies` array on the root config's `templates/nuxt-app`
      workspace override, the same way `TEMPLATE_ESLINT_PEER_DEPENDENCIES` is
      already ignored there for an analogous reason.
