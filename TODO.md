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

## Release

- [~] `eslint-config@0.6.0`, `quality-config@0.3.0` and `create-baseline@0.3.2`
  are bumped, changelogged and tagged locally on `ac7b511`, but not pushed and
  not published. `pnpm release:check` therefore reports all three as
  `npm has no <version>`, which is the expected state between the tag and the
  publish, not a defect. Publishing is a manual `workflow_dispatch` on
  `.github/workflows/publish.yml`, one run per package, tokenless through npm
  Trusted Publishing (OIDC). Remaining steps, in order:
  `git push --follow-tags`, then
  `gh workflow run publish.yml -f package=eslint-config`, the same for
  `quality-config`, and `create-baseline` last so it never pins a version npm
  does not yet serve. Confirm with `pnpm release:check` reporting `ok` for all
  six packages.
