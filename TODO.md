# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

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
