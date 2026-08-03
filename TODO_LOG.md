# TODO Log

Closed work from `TODO.md`, grouped by year and month.

## 2026-08

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
