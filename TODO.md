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

- [~] **Release ui-quality, db-quality and test-quality with the warning level
  removed.** ui-quality 0.8.0 is out (2026-10-11, logged); db-quality and
  test-quality wait on owner approval. Decided 2026-10-11 (owner): no warnings,
  error or nothing. Decided 2026-10-11 (owner via Codex adjudication, u3): the
  same for db-quality and test-quality, one release each. Decided 2026-10-11
  (owner via Codex adjudication, u1): prepare a minor pre-1.0 release, publish
  only after the owner approves the verified packages. Decided 2026-10-11 (owner
  via Codex adjudication, u2): keep `NARROW_PAGE_RATIO` at 0.55. Prepared: all
  three CHANGELOGs carry the breaking change under `Unreleased`, versions are
  not bumped (a bump without its tag and npm version fails
  `pnpm release:check`), `pnpm check:ci` and `pnpm release:check` exit 0, and
  the narrow-page suites pass (7 tests). Direct consumers pin older ranges (Vexa
  ui-quality 0.2.0; db-quality `^0.3.0`/`^0.6.0`/`0.2.1`; test-quality
  `^0.1.x`), so none upgrades on publish alone. Next step, on owner approval,
  per package: bump ui-quality 0.7.0 -> 0.8.0, db-quality 0.6.1 -> 0.7.0,
  test-quality 0.1.2 -> 0.2.0, rename `Unreleased` to the version,
  `pnpm sync-versions`, `pnpm check:ci`, commit,
  `git tag -a <name>@<version> -m ...`, push with the tag,
  `gh workflow run publish.yml -f package=<name>`, `gh run watch`,
  `pnpm release:check`.
- [ ] **`interaction-shift` for tabs.** The owner's case was "a tab or segmented
      control"; the shipped probe presses `role=group` sets of `aria-pressed`
      buttons only, as the candidate specified. Next step: press `role=tab`
      options of a `role=tablist` the same way, and measure the bar around the
      tab list, not the panel (a panel of another height is expected).

## Cross-project (filed 2026-09-09 from two consumer backlog runs)

## Routed from `~/p/TODO.md` (2026-10-03)

Moved verbatim from `~/p/TODO.md` on 2026-10-03; the routing table in
`~/p/TODO_LOG.md` (entry of that date) records each move.
