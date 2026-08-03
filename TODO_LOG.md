# TODO Log

Closed work from `TODO.md`, grouped by year and month.

## 2026-08

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
