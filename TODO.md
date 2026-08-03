# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

## Quality gates

- [ ] `dependency-cruiser` resolves TypeScript path aliases through a single,
      repo-wide `tsConfig` option — it has no concept of "nearest tsconfig to
      this file" for a monorepo where each package/template defines its own
      alias relative to its own root (`@/*` in
      `packages/eslint-plugin-code-policy` and `templates/vue-app`; `~/*` in
      `templates/nuxt-app`). Pointing the root `.dependency-cruiser.cjs` at any
      one package's tsconfig would apply that package's alias mapping to every
      other cruised file too, producing wrong edges rather than no edges. With
      no `tsConfig` passed (the repo has no root tsconfig), every aliased import
      shows up as `couldNotResolve: true` (verified with
      `depcruise --output-type json`), and files reached only through such
      imports look like `no-orphans` false positives even though they have real
      importers. Task 9 tuned around the currently-affected files with `pathNot`
      patterns scoped to the `utils/` directory and `version.ts` in
      `packages/eslint-plugin-code-policy/src` (reached via `@/`), the `types/`,
      `stores/`, and `App.vue` under `templates/vue-app/src` (reached via `@/`),
      and the `types/` directory under `templates/nuxt-app/app` (reached via
      `~/`). Any _new_ file in those same trees that is reachable only via an
      aliased import will silently pass `no-orphans` even if it is genuinely
      dead — this is a real, open coverage gap, not a one-time fix. `app.vue`
      and everything under `pages/` in `templates/nuxt-app/app` are a different
      case, excluded separately: they have zero dependencies **and** zero
      dependents (verified the same way), because Nuxt loads them by filename
      convention rather than via any import, aliased or not — there is no
      aliased import to "fix" there.

      **A real fix exists and was not implemented here**: run `depcruise` once per workspace with that workspace's own `--ts-config`, the same pattern this repo already uses for knip (`pnpm -r --filter "./templates/*" knip`, each template running its own `knip.config.ts`/tsconfig). Per-workspace resolution would let each package's aliases resolve correctly and close this coverage gap without any `pathNot` suppression, while the root `deps:graph` run keeps enforcing `no-circular` and `packages-must-not-depend-on-templates`, which genuinely need the whole graph and can't be split per workspace. Not implemented in Task 9 — it's a `package.json`/script restructuring beyond that task's scope, not a config tuning change.

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
- [ ] Task 15 added five `pnpm-workspace.yaml` overrides to clear
      `pnpm audit --audit-level=high` findings that survived `pnpm dedupe`:
      `tmp@<0.2.6`, `fast-uri@<3.1.4`, `sharp@<0.35.0`, `postcss@<8.5.18`, and
      `brace-expansion@<1.1.17`. Each is a stopgap, removable once its own
      upstream floor moves past the patched version named in the override:
      `@lhci/cli` (tmp), astro's language server chain (fast-uri), `next`
      (sharp, postcss), and `eslint-plugin-import`'s `minimatch` dependency
      (brace-expansion). To check whether one is still load-bearing, remove it
      and run `pnpm install && pnpm audit --audit-level=high` - if the advisory
      it named does not come back, drop it for good.
- [ ] `templates/nuxt-app` fails `create-baseline --check --hard` on a missing
      `@busirocket/tsconfig` devDependency. Pre-existing since `d71e1dd`, which
      dropped it as a knip dead-dependency finding because nuxt-app's own
      tsconfig does not extend the package. Re-adding the dependency to satisfy
      create-baseline would immediately trip the knip unused-dependency gate
      again, so this needs a real decision, not a patch: either wire nuxt-app's
      tsconfig to actually extend `@busirocket/tsconfig`, or make
      create-baseline's required-package list framework-aware.
- [!] Lighthouse cannot measure `templates/vite-react-app` or
  `templates/tauri-app` in any environment tried: both report `NO_FCP` ("the
  page did not paint any content") on macOS and on ubuntu-latest. The other four
  templates that define `perf:check` measure correctly once their server ports
  stop colliding (fixed in 2bf9cc9). Because both environments agree, this looks
  like a property of those two templates - the built bundle does not render -
  rather than a headless Chrome limit. The `Performance budget` CI step was
  removed while this is open, so the budget currently enforces nothing. Smallest
  next step: serve `templates/vite-react-app/dist` and open it in a real browser
  to see whether the app mounts at all; if it does not, that is a template bug
  worth more than the gate. Re-add the step to the `verify` job in
  `.github/workflows/ci.yml` once both templates render.
