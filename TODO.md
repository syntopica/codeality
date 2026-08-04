# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Quality gates

- [!] Three `pnpm-workspace.yaml` security overrides remain load-bearing and are
  still stopgaps: `tmp@<0.2.6` (`@lhci/cli`), `sharp@<0.35.0` and
  `postcss@<8.5.18` (both `next`). Verified 2026-08-03 by removing all five
  then-current overrides and reinstalling: those three advisories came back as
  `high`, so each still carries its own weight. Rechecked 2026-08-04, and the
  blocker moved but did not clear. `@lhci/cli` is still `0.15.1`, so the `tmp`
  entry has no newer floor at all. `next` has published `16.3.0`, which is the
  release the previous check was waiting for - but pnpm 11's release-age
  cooldown holds it back, and `pnpm update` silently reverts to `16.2.12` rather
  than failing. Forcing it with `pnpm update next@16.3.0` is worse than it
  looks: it auto-wrote **ten** entries into `minimumReleaseAgeExclude` (`next`
  plus all nine `@next/swc-*` binaries), which is exactly the supply-chain
  bypass that block's own comment forbids ("Everything else still honors the
  cooldown"). Reverted. Smallest unblock action: once `next@16.3.0` ages out of
  the cooldown, `pnpm update next -r` picks it up on its own; then remove the
  `sharp` and `postcss` entries, run
  `pnpm install && pnpm audit --audit-level=high`, and drop whichever advisory
  does not return.

- [ ] Two advisories sit below the `--audit-level=high` gate and are
      deliberately not overridden: `uuid@<11.1.1` (moderate,
      GHSA-w5hq-g745-h8pq, via `@lhci/cli > uuid` in six templates -
      `astro-site`, `nextjs-app`, `nuxt-app`, `tauri-app`, `vite-react-app`,
      `vue-app`) and `esbuild >=0.27.3 <0.28.1` (low, GHSA-g7r4-m6w7-qqqr, via
      `packages/eslint-plugin-code-policy > tsup > esbuild` and
      `> vitest > vite > esbuild`). The `overrides:` block in
      `pnpm-workspace.yaml` is scoped by its own comment to `high` findings, so
      forcing these would contradict the stated policy and pin two more
      transitive edges for no gate benefit. Both paths were re-measured
      2026-08-04: the esbuild finding no longer reaches through
      `@vitest/eslint-plugin` - bumping that to `1.6.26` removed the edge - and
      what remains is `eslint-plugin-code-policy`'s own build and test
      toolchain. Expected to clear when Renovate bumps `@lhci/cli`, `tsup` and
      `vitest`; revisit only if either advisory is re-scored `high`, which would
      make it a gate failure and move it into the entry above.

- [ ] `pnpm check:quality` failed once on a cold run and passed on every run
      after, with the same tree and no intervening change. Not isolated: the
      chain ends in `publish:check`, whose Turbo task depends on `^build` and
      `build`, so a cold invocation builds every template first - the same area
      as the already-recorded Turbo race. Smallest next step: reproduce with
      `pnpm exec turbo run publish:check --force` from a cleared cache and
      capture which task fails, rather than the aggregate exit code.

## Consumer findings

Five findings from adopting the current standard in `BusiRocket/busirocket`
(Next.js 16, ESLint 10.8) on 2026-08-04. Each is patched locally in that repo,
so the local patch is the acceptance test: the fix here is right when busirocket
can delete it and stay green.

- [ ] `createKnipConfig({ framework: 'nextjs' })` lists `{,src/}middleware.ts`
      as an entry, and Next 16 renamed that file to `proxy.ts`. In a repo that
      followed the rename, the proxy and everything it imports are reachable
      from no entry point at all, so knip reports them as unused files while
      also emitting a "Refine entry pattern (no matches)" hint for the pattern
      that no longer matches anything. `FRAMEWORK_ENTRIES.nextjs` in
      `packages/quality-config/src/knip-framework.ts` should carry both names -
      `middleware.ts` still exists in Next 15 consumers - and the App Router
      metadata files (`sitemap`, `robots`, `manifest`, `icon`, `apple-icon`,
      `opengraph-image`, `twitter-image`) belong in the same entry list for the
      same reason.

- [ ] `createDepCruiserConfig`'s built-in `no-orphans` exemptions cover
      `app/(sitemap|robots).tsx?` and nothing else of the App Router. Every
      other file convention - `page`, `layout`, `route`, `loading`, `error`,
      `not-found`, `template`, `default`, `icon`, `opengraph-image`,
      `manifest` - is loaded by Next by filename and imported by nothing, so a
      consumer with a normal App Router gets one orphan error per route. The
      exemption list in `packages/quality-config/src/dependency-cruiser.ts`
      should name them.

- [ ] Any `no-orphans` exemption added there must avoid nested quantifiers.
      dependency-cruiser runs every `pathNot` entry through safe-regex and, when
      one trips it, abandons the **whole rule** with
      `has an unsafe regular expression. Bailing out.` rather than skipping the
      offending pattern - so a single bad entry silently turns the orphan check
      off. `(^|/)app/(.*/)?(page|layout|...)\.(ts|tsx)$` is enough to trigger
      it; an anchored `^src/app/.*(page|layout|...)\.(ts|tsx)$` is not. Worth a
      comment in the factory next to the list, because the failure names the
      rule and not the pattern.

- [ ] `createNextjsConfig` resolves the React version itself now (1beb68d), and
      a consumer carrying the older `settings: { react: { version: 'detect' } }`
      override reinstates the detection that fix removed. On ESLint 10 that is
      not a warning: `eslint-plugin-react` 7.37.5 crashes in its own version
      detection with `contextOrFilename.getFilename is not a function`, and
      every file fails before a rule runs. The adoption guide
      (`docs/adoption/existing-repo.md`) already describes the crash but not the
      override that causes it - it should say to delete any local
      `react.version` setting, since that is what an ESLint 9 era config will
      have.

- [ ] `createKnipConfig`'s `ESLINT_PEER_DEPENDENCIES` list is written for a
      template that inherits those plugins transitively. A consumer that
      declares them directly gets a "Remove from ignoreDependencies" hint for
      each one it declares (`@vitest/eslint-plugin` and
      `eslint-plugin-testing-library` in busirocket's case). Hints do not fail
      the gate, and filtering them consumer-side would drift from the preset, so
      the question is whether the ignore list should be conditional on what the
      consumer declares or simply documented as expected noise.

## Repo hygiene

- [ ] The three tags cut on 2026-08-04 (`eslint-config@0.6.0`,
      `quality-config@0.3.0`, `create-baseline@0.3.2`) are **lightweight**,
      while every tag before them is annotated (`git cat-file -t` returns `tag`
      for `eslint-config@0.5.0` and `commit` for these). They are already
      pushed, and a release tag is immutable, so they stay as they are. The
      thing to fix is the next release: create tags with `git tag -a -m`, or
      have `brp-release` do it, so the history stops mixing both kinds.
