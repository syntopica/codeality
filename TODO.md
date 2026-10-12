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

- [~] **`check:ci` queues behind a host admission wrapper** (2026-10-11).
  Decided 2026-10-11 (owner via Codex adjudication): one heavy suite per host,
  two test workers each. Done: `check:ci` runs `check:ci:run` through
  `heavy-suite` when it is on the PATH, and directly otherwise (CI included);
  `turbo.json` passes `HEAVY_SUITE_ADMITTED`, `HEAVY_SUITE_WORKERS` and
  `VITEST_MAX_WORKERS` through strict env mode, so the cap reaches each vitest
  run. Remaining: turbo still runs up to ten package tasks at once inside one
  admitted run; decide whether the wrapped gate also takes `--concurrency=2`.

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

- [ ] **New rule: a crowded meta line that CSS-ellipsizes its own content**
      (2026-10-12, InteliFactu Documentos viewer list, owner report). One row
      line held date + category chip + account name + amount at ~600px; the
      account name rendered as "Caix..." and "VEOPLAN ESPJ Op..." while
      `text-hard-cut` stayed silent because the cut is
      `text-overflow: ellipsis`, not upstream. Measure: a flex row of 3+ inline
      items where an ellipsized child shows fewer than ~12 visible characters
      (scrollWidth > clientWidth) at rest. Smallest next step: a fixture with
      that row and a failing test in `packages/ui-quality/tests`.

- [ ] **New rules from the InteliFactu Modelos casilla panel** (2026-10-12,
      owner report on a `lang="es"` page; no current rule fired): (a)
      `date-locale`: visible ISO dates (`2026-09-30`) on a page whose
      `<html lang>` is not `en`/ISO-first; `DATE_TEXT` already matches them. (b)
      `money-without-unit`: a column of decimal amounts (`4,20`, `10,50`) in a
      list with no currency symbol or unit header anywhere in the list. (c)
      `backdrop-dismiss`: in `behaviour`, after opening a modal layer
      (`isModalLayer`), click the backdrop outside the panel and press Escape;
      flag when neither closes it. (d) `list-dangling-rule`: a list whose last
      item ends in a border followed by nothing (no total, no footer). (e)
      monospace used for proportional prose (names, labels) inside a sans UI.
      (f) an unbreakable string (a formula `152+03+06+...`) overflowing its
      panel and clipped at the edge by a scroll container; check why the
      existing clip rules missed it. (g) a footer "Total" that only repeats a
      single row above it. Smallest next step: one fixture page with all five
      and failing tests in `packages/ui-quality/tests`.

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
