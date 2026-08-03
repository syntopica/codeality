# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

## Release

- [!] `@busirocket/quality-config@0.1.0` and `@busirocket/create-baseline@0.3.0`
  are tagged and green on CI but **not published to npm** - blocked on the first
  publish of `quality-config`, which cannot go through `publish.yml`. That
  workflow is tokenless by design (npm Trusted Publishing over OIDC), and npm's
  own prerequisite is that "the package you're configuring must already exist on
  the npm registry" - so a brand-new package name has no trusted publisher to
  exchange the OIDC token against. Run 30805714749 shows exactly that:
  `Skipped OIDC: ERR_PNPM_AUTH_TOKEN_EXCHANGE ... (status code 404)`, then pnpm
  falls back to `NODE_AUTH_TOKEN`, which is the literal
  `XXXXX-XXXXX-XXXXX-XXXXX` placeholder `setup-node` writes when no secret is
  supplied, and npm answers
  `E404 PUT https://registry.npmjs.org/@busirocket%2fquality-config`. Smallest
  unblock: one authenticated `npm publish` of `packages/quality-config` from a
  machine logged in to an npm account with publish rights on the `@busirocket`
  scope, then add the trusted publisher on npmjs.com (organization `BusiRocket`,
  repository `baseline`, workflow `publish.yml`, allowed action `npm publish`,
  no environment). Every later release then goes through the workflow tokenless,
  as designed. **Publish order matters:** `create-baseline@0.3.0` must not go
  out first. Its `baseline-versions.json` pins
  `@busirocket/quality-config@^0.1.0` and `--check` now requires that package,
  so releasing the CLI while the dependency is absent from npm hands consumers
  an install line that cannot resolve. `create-baseline` is already on npm at
  0.2.1, so its own trusted publisher is presumably configured and it should
  publish normally once `quality-config` exists.

## Quality gates

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
      finding: `bootstrap` in `src/main.ts`, exported but only ever called in
      the same file via `void bootstrap()`. Investigated whether to drop the
      `export` (fix round 1): doing so makes `pnpm lint` fail —
      `code-policy/no-hidden-top-level-declarations` (the Primary Unit Rule this
      repo enforces via `eslint-plugin-code-policy`) requires every top-level
      declaration to be exported, specifically to forbid hidden internal helpers
      at module scope. So `bootstrap` is not dead code by this repo's own
      convention: it looks unused only because nothing inside this monorepo
      imports `templates/nestjs-app/src/main.ts` as a module (it is a process
      entry point, run directly, exactly like `page.tsx` or `main.tsx` in the
      other templates) — the export exists to satisfy the template's own
      one-exported-unit-per-file rule, not to be consumed by a caller. Reverted
      the drop; `export` stays. `vue-app` surfaces a false positive: `mountApp`
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
      still fail `pnpm check:ci` for `vue-app`, and the only fix is a
      template-source change (restructure `vue-app`'s composition-root
      import/barrel) that Task 8 was told not to make just to satisfy knip.
      Revisit together with template-source ownership: resolve `vue-app`'s
      barrel/alias pattern, then re-run the same `--include-entry-exports` probe
      on all eight templates before flipping the default on. `nestjs-app`'s
      `bootstrap` needs no further action.
- [!] `type-coverage` incompatible with the `@typescript/typescript6` alias —
  blocked. Error:
  `TypeError: Cannot read properties of undefined (reading 'Unknown')`. Smallest
  unblock: retry after the repo moves off the alias to a released TypeScript 6,
  or evaluate `tsc --noEmit --strict` + a custom `as`-cast counter instead.
- [ ] Three `pnpm-workspace.yaml` security overrides remain load-bearing and are
      still stopgaps: `tmp@<0.2.6` (`@lhci/cli`), `sharp@<0.35.0` and
      `postcss@<8.5.18` (both `next`). Verified 2026-08-03 by removing all five
      then-current overrides and reinstalling: those three advisories came back
      as `high`, so each still carries its own weight. Recheck the same way when
      `@lhci/cli` or `next` moves its own floor past the patched version named
      in the override comment - remove the entry, run
      `pnpm install && pnpm audit --audit-level=high`, and drop it for good if
      the advisory does not return.
