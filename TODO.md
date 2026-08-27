# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

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
