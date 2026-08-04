# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Quality gates

- [ ] **`createNextjsConfig` is broken on ESLint 10 unless the consumer pins the
      React version.** `eslint-plugin-react@7.37.5` - the newest published -
      auto-detects the React version through `context.getFilename()`, removed in
      ESLint 10, so every file fails with
      `TypeError: Error while loading rule 'react/display-name':     contextOrFilename.getFilename is not a function`
      before a single rule runs. Found 2026-08-04 adopting the baseline in
      `capture-service` (`CristianDeluxe/capture-service`) on `eslint@10.8.0` and
      `eslint-config-next@16.3.0`. Workaround the consumer had to discover:
      `settings: { react: { version: '19.2.4' } }` after the nextjs layer, which
      skips detection entirely. Worth pushing into `createNextjsConfig` itself -
      the version is knowable from the template's own `react` dependency - so
      consumers do not each hit a crash that looks like their own config.

- [ ] **`createCodeQualityConfig` needs `eslint-plugin-testing-library` and does
      not say so.** `code-quality.ts` imports `./testing`, which imports the
      plugin, and consuming the package resolves its `src/*.ts` rather than a
      build, so a consumer without that devDependency fails `tsc --noEmit` with
      `Cannot find module 'eslint-plugin-testing-library'`. The templates all
      happen to install it, which is why it has not surfaced. Same 2026-08-04
      adoption. Either declare it as a peer dependency of `eslint-config` or
      name it in the adoption docs beside the other peers.

- [ ] **The knip Next.js preset assumes `app/` at the repository root, and
      silently inspects nothing when the project uses `src/app/`.** Every entry
      and project pattern misses, knip exits 0, and the gate reports clean
      having read no source file - the failure mode where a green check is worse
      than no check. Knip does say `Refine entry pattern (no matches)` under
      Configuration hints, but that is advisory text above a passing run.
      Options: accept a `srcDir` option in `createKnipConfig`, or have
      `FRAMEWORK_ENTRIES` carry both prefixes. Found 2026-08-04, same adoption.

- [!] Three `pnpm-workspace.yaml` security overrides remain load-bearing and are
  still stopgaps: `tmp@<0.2.6` (`@lhci/cli`), `sharp@<0.35.0` and
  `postcss@<8.5.18` (both `next`). Verified 2026-08-03 by removing all five
  then-current overrides and reinstalling: those three advisories came back as
  `high`, so each still carries its own weight. Blocked on upstream, not on work
  here: `@lhci/cli` resolves `^0.15.1` and `next` resolves `^16.2.12`, and both
  are the latest version either project has published, so neither has a newer
  floor to recheck against. Confirmed 2026-08-03: `npm view @lhci/cli version`
  -> `0.15.1`, `npm view next version` -> `16.2.12`, lockfile resolves the
  patched `tmp@0.2.7` / `sharp@0.35.3` / `postcss@8.5.24`, and
  `pnpm audit --audit-level=high` exits `0`. Smallest unblock action: when
  either project publishes a release that moves its own floor past the patched
  version named in the override comment, remove that entry, run
  `pnpm install && pnpm audit --audit-level=high`, and drop it for good if the
  advisory does not return.

- [ ] Two advisories sit below the `--audit-level=high` gate and are
      deliberately not overridden: `uuid@<11.1.1` (moderate,
      GHSA-w5hq-g745-h8pq, via `templates/astro-site > @lhci/cli > uuid`) and
      `esbuild >=0.27.3 <0.28.1` (low, GHSA-g7r4-m6w7-qqqr, via
      `packages/eslint-config > @vitest/eslint-plugin > esbuild`). The
      `overrides:` block in `pnpm-workspace.yaml` is scoped by its own comment
      to `high` findings, so forcing these would contradict the stated policy
      and pin two more transitive edges for no gate benefit. Recorded so a
      future session does not rediscover them as a surprise. Expected to clear
      themselves when Renovate bumps `@lhci/cli` and `@vitest/eslint-plugin`;
      revisit only if either advisory is re-scored `high`, which would make it a
      gate failure and move it into the entry above.
