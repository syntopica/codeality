# TODO Log

Closed work from `TODO.md`, grouped by year and month.

## 2026-08

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
