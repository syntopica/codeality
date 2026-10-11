# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Python baseline

- [ ] Python backlog left after four passes (every gate exit 0 on a clean
      `origin` worktree): DJCenterDeluxe 4 (test-fixture SQL, accepted).
      djplayerdeluxe 39 findings and 28 mypy ignore sections: the Qt, audio and
      Bluetooth modules (typing them changes the None path) and the backend
      families chosen by try/except import, kept on purpose. Both TODO.md files
      list the latent bugs the characterisation tests pinned. Next step only if
      the hardware code is touched for another reason.

## Estate

- [!] **Drop the typescript-eslint 8.71.1 overrides once 8.71.2 ships**
  (2026-10-07). 8.71.1 reports every variable in a `.js`/`.mjs` file as "only
  used as a type" (`isTypeOnlyReference` tests `!ref.isValueReference`,
  undefined on espree references; upstream issue 12980, fixed on main,
  unreleased). `pnpm-workspace.yaml` pins `typescript-eslint` and
  `@typescript-eslint/eslint-plugin` 8.71.1 to 8.71.0 and the manifests stay on
  `^8.71.0`. Consumers of `@syntopica/eslint-config` that resolve 8.71.1 hit the
  same wall on their JS files. Next step: when
  `npm view typescript-eslint version` passes 8.71.1, remove both lines,
  `ncu -u`, `pnpm install`, `pnpm check:ci`. Rechecked 2026-10-11:
  `npm view typescript-eslint version` and the plugin both still answer 8.71.1.

## ui-quality

The candidates of the 2026-10-01 review and the 2026-10-08/09 inpractise-demo
findings have shipped (`ragged-column`, `interaction-shift`, `narrow-page`,
unreleased on `main`; see `TODO_LOG.md`). One half of those findings is left,
plus the release:

- [ ] **Release ui-quality with the warning level removed.** Decided 2026-10-11
      (owner): no warnings, error or nothing. Every ui-quality finding is now an
      error (breaking, recorded under `Unreleased` in its CHANGELOG); the
      release itself is the owner's to authorize. Next step: owner approval,
      then a minor bump (pre-1.0, breaking), `pnpm check:ci`,
      `pnpm release:check`, publish.
- [ ] **`interaction-shift` for tabs.** The owner's case was "a tab or segmented
      control"; the shipped probe presses `role=group` sets of `aria-pressed`
      buttons only, as the candidate specified. Next step: press `role=tab`
      options of a `role=tablist` the same way, and measure the bar around the
      tab list, not the panel (a panel of another height is expected).

## Cross-project (filed 2026-09-09 from two consumer backlog runs)

## Routed from `~/p/TODO.md` (2026-10-03)

Moved verbatim from `~/p/TODO.md` on 2026-10-03; the routing table in
`~/p/TODO_LOG.md` (entry of that date) records each move.
