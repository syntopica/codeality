# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Quality gates

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
      when enough cold runs pass to call it gone. Third clean cold run
      2026-08-27 (`rm -rf node_modules/.cache/turbo .turbo`, 14/14 tasks,
      6 gates, exit 0) - and this one exercised the new tsconfig-check code
      paths too. One or two more clean cold runs on later days and this
      closes as gone.

## Test strength

- [ ] `packages/eslint-plugin-code-policy` scores **77.05%** on mutation testing
      (was 67.68%): 860 killed, **234 survived**. The rule suites execute every
      branch and assert loosely - a changed `messageId`, a report moved to a
      different node, or an inverted boundary condition usually survives.
      Coverage cannot see this, which is the whole reason the gate was added.
      Run it with `pnpm --filter eslint-plugin-code-policy run mutation`.

  `thresholds.break` is 77 in `stryker.config.mjs`, just under the measured
  score, so the number can only ratchet upward. The work is per rule and
  independent: take one file from the table, read its surviving mutants, tighten
  the assertions that let them live, then raise `break` to the new floor. Done:
  `atomic-file.ts` 92.74% (2026-08-27); `no-mixed-barrel.ts` 87.00%,
  `no-inline-types-in-runtime-files.ts` 85.60%, `no-inline-types.ts` 80.47%
  (2026-08-28). Worst remaining: `view-logic-separation.ts` 62.65%,
  `one-primary-unit.ts` 62.84%, `file-kind-placement.ts` 65.22%,
  `public-api-imports.ts` 66.67%.

## Estate

- [ ] Bring the rest of the estate up to the wiring the conformance check now
      asserts. `pnpm estate ~/p` prints the matrix; 22 of 23 consumers fail at
      least one column.

  `create-baseline --fix` repairs the mechanical half - the `--max-warnings 0`
  flag, gates missing from `check:*`, coverage thresholds, the CI workflow,
  stuck version ranges. The rest needs a decision per repository. The four
  `client-widgets-*` widgets are the largest gap: they predate
  `@busirocket/quality-config` entirely and sit four minors behind on
  `eslint-config`.
