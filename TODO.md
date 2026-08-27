# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Test strength

- [ ] `packages/eslint-plugin-code-policy` scores **85.98%** on mutation testing
      (was 60.80% when the gate was added): 960 killed, **143 survived**. The
      rule suites executed every branch and asserted loosely - a changed
      `messageId`, a report moved to a different node, or an inverted boundary
      condition usually survived. Coverage cannot see this, which is the whole
      reason the gate was added. Run it with
      `pnpm --filter eslint-plugin-code-policy run mutation`.

  `thresholds.break` is 85 in `stryker.config.mjs`, just under the measured
  score, so the number can only ratchet upward. The work is per rule and
  independent: take one file from the table, read its surviving mutants, tighten
  the assertions that let them live, then raise `break` to the new floor. Eight
  of ten rules are done across three waves (2026-08-27/28), all at 80-94%.
  Remaining: `no-cross-module-deep-imports.ts` 68.52% and
  `no-hidden-top-level-declarations.ts` 78.29%; after those, the long tail is
  diminishing returns - decide then whether the package floor is high enough.

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
