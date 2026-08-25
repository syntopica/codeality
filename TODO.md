# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Quality gates

- [!] Two advisories sit below the `--audit-level=high` gate and are
  deliberately not overridden: `uuid@<11.1.1` (moderate, GHSA-w5hq-g745-h8pq,
  via `@lhci/cli > uuid`, resolved at 8.3.2) and `esbuild >=0.27.3 <0.28.1`
  (low, GHSA-g7r4-m6w7-qqqr, via `eslint-plugin-code-policy`'s own tsup and
  vitest toolchains, resolved at 0.27.7). The `overrides:` block is scoped by
  its own comment to `high` findings, so forcing these would contradict the
  stated policy and pin two more transitive edges for no gate benefit.
  Re-measured 2026-08-25 after the Next 16.3.2 move removed the two `next`
  overrides: unaffected, still 1 low + 1 moderate,
  `pnpm audit --audit-level=high` exit 0.

      **Not waiting on Renovate.** Both consumers are already at their latest
      published release: `@lhci/cli` is 0.15.1 with no newer version at all, and
      `tsup` is 8.5.1 whose own dependency range is `esbuild ^0.27.0`, so no
      resolution inside that range can reach the patched 0.28.1. A vitest bump
      does not help either - 4.1.10 and 4.1.11 declare the same
      `vite ^6 || ^7 || ^8`. Unblock: `tsup` publishing a release that widens
      past `esbuild ^0.27.0`, or `@lhci/cli` publishing past 0.15.1. Revisit
      only on that, or if either advisory is re-scored `high`.

- [~] `pnpm check:quality` failed once on a cold run and passed on every run
  after. **The reporting half is fixed; the original failure is still not
  reproduced.** `check:quality` was a `pnpm a && pnpm b && ...` chain, so the
  only thing a summary showed was the aggregate exit code - which is why the
  original report could never be acted on. It now runs
  `scripts/check-quality.mjs`, same first-failure semantics, printing
  `check:quality: FAIL     <step> (exit <code>)` and exiting with that step's
  code. The next occurrence names itself.

      Re-run 2026-08-25 from a deleted turbo cache
      (`rm -rf node_modules/.cache/turbo .turbo`): both
      `pnpm exec turbo run publish:check --force` and `pnpm check:quality`
      exited 0. Two concrete instances of the same class have been found and
      fixed, neither proven to be this one - 2026-08-24,
      `my-nextjs-app#type-check` depended on `^build` instead of its own
      `build`, so it read a `.next/types/routes.d.ts` nothing had written; and
      2026-08-25, pnpm does not relink a workspace package's bins when only
      that package's `bin` map changes, so `pnpm type-coverage` died with
      `sh: baseline-type-coverage: command not found` until
      `node_modules/.pnpm-workspace-state-v1.json` and
      `node_modules/.package-map.json` were deleted and reinstalled (documented
      in `docs/standards/quality-gates.md`; CI installs from scratch and never
      sees it). Close this when a cold run fails again and names its step, or
      when enough cold runs pass to call it gone.
