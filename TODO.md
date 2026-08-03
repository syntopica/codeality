# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Quality gates

- [ ] Three `pnpm-workspace.yaml` security overrides remain load-bearing and are
      still stopgaps: `tmp@<0.2.6` (`@lhci/cli`), `sharp@<0.35.0` and
      `postcss@<8.5.18` (both `next`). Verified 2026-08-03 by removing all five
      then-current overrides and reinstalling: those three advisories came back
      as `high`, so each still carries its own weight. Recheck the same way when
      `@lhci/cli` or `next` moves its own floor past the patched version named
      in the override comment - remove the entry, run
      `pnpm install && pnpm audit --audit-level=high`, and drop it for good if
      the advisory does not return.
