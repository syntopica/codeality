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

## Dart and Swift baseline

- [!] Owner: first pub.dev release of `codeality_lints` then `codeality_dart` is
  manual (pub.dev cannot enable automated publishing for a package that does not
  exist). Blocked on the owner's pub.dev login. Smallest step: in each of
  `packages/codeality-dart-lints` and `packages/codeality-dart` run
  `dart pub publish`, then on each package's Admin tab enable GitHub Actions
  publishing (repository `syntopica/codeality`, tag pattern
  `<name>-v{{version}}`, environment `pub.dev`); CLAUDE.md has the steps. Until
  then consumers (stagebeat) pin both by git ref.

## Estate

- [ ] **Wait for registry availability in the npm publish workflow**
      (2026-10-21). Run 39529271695 succeeded before quality-config 0.15.0 was
      visible in npm metadata or installable; it became available a few minutes
      later. Smallest next step: add pnpm's supported
      `--publish-wait-timeout 600000` to the workflow publish command, so
      success also verifies metadata and tarball availability.

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

- [ ] **`sort-broken` fires on a server-sorted board that sorts correctly.**
      TienesLaVibra `/admin/councils` (2026-10-14): the "Ayuntamiento / Evento"
      header is a `<Link>` to `?sort=nombre`; clicking it twice in Playwright
      gives A..Z then Z..A, and the probe's own comparator accepts both orders,
      yet the probe reports "out of order both times" on the first screen (1920
      light) only, every run. Suspect the read lands during the RSC navigation
      after the filter probe's restore. Next step: log the keys
      `orderAfterClick` reads on that page.
- [ ] **A count over a list of years reads as one grouped number.** A cell
      showing "1" over "2026" (two block lines) has innerText "1\n2026", which
      `AMOUNT_TEXT` takes as 12026, so a correct "Años" column was flagged
      `sort-broken`. Worked around in the consumer ("1 año"); the probe could
      read block lines separately.
- [ ] **`touch-target` overlap with a sticky header.** Rows scrolled under a
      sticky `<thead>` in the phone capture are reported as overlapping its sort
      buttons; only the visible, unobscured part is a tap target.

- [ ] **Misses the owner caught by eye on InteliFactu's fiscal review**
      (2026-10-12, fixed there in 918be511 and 85616f03; route
      `/app?view=fiscal&company=5`). Smallest next step: one fixture per item.
  - `date-locale` exists but never saw the ISO dates: they sit in a tray's rows,
    rendered only after clicking a tray counter. The sweep has to open
    disclosure triggers (a row of counters whose click mounts a list) before it
    snapshots.
  - Select caret inset: a native `<select>` whose arrow sits within ~8px of its
    right border while the text inset is the same 8px. Candidate rule
    `cramped-select-caret`: compare the select's right padding with its left,
    and flag appearance-auto selects with under 1.25rem of right room. Seen
    again 2026-10-14 on tieneslavibra's council province filter (`px-3` select,
    caret flush to the border; replaced by a combobox in abb29406), so two
    consumers now: worth building next.
  - Truncated text with slack: "Comisiones banc..." cut to a fixed `w-28` while
    the same row had hundreds of free pixels in a `flex-1` sibling.
    `text-clipped` needs a slack check: clipped text whose row has more free
    width than the text is missing.
  - Repeated row label: the same text button ("Documentos candidatos") on every
    row of a list, a column of identical words. Candidate rule
    `repeated-row-action`: 4 or more rows carrying a byte-identical button label
    should be an icon with a tooltip.
  - Row hover read as zebra striping in a static screenshot: the first row was
    shaded because the pointer rested there. Captures should park the pointer
    outside the viewport before the shot.
  - Rule rows listing a company scope that the page's own company picker already
    fixed (every row said "VeoPlan ESPJ" on VeoPlan's screen), and a select
    offering other companies than the selected one. Candidate rule
    `redundant-column`: a column whose value is identical on every row and equal
    to a breadcrumb or picker value on the page.

- [~] **False positives from the InteliFactu interaction-state sweep**
  (2026-10-12, workspace build d0c9743; screenshots under the sweep's scratchpad
  `cq/.codeality-ui/screens/`, routes in `~/p/intelifactu/codeality-ui.json`,
  each kept there by a `disable` with its reason). Smallest next step: one
  near-miss fixture per item.
  - `list-dangling-rule` on virtualised rows (`div.absolute.left-0` inside a
    scrolling table body, `/app?view=administraciones&screen=deudas`): the
    scroller is an ancestor, not the list itself.
  - `text-occlusion` and `text-cramped` (2px) on the last viewer-list row that
    scrolls under a sticky pager of the same scroller
    (`/app?view=bank&company=2&screen=documents-viewer`).
  - `row-height-scale` on the react-day-picker calendar (`.rdp-root table`,
    weekday caption row 19px vs 36px day cells,
    `/app?view=documentos&company=2&screen=viewer-dates`).
  - False negative: `crowded-meta-line` did not fire on the Modelos formula line
    ("Otras operaciones con in…", 3 children, 320px aside) because the visible
    text is over 12 characters; the casilla label was still unreadable.

- [ ] **`label-wrap`: the misaligned icon half, and line-clamp for
      `crowded-meta-line`** (2026-10-12, deferred from the Modelos panel rules).
      `label-wrap` measures the wrap only; an icon centred against a two-line
      label is not measured, and `crowded-meta-line` reads
      `text-overflow: ellipsis` only, not `-webkit-line-clamp`. Smallest next
      step: have the probe read `-webkit-line-clamp`, and add a fixture with an
      svg beside a wrapped `dt` to measure the icon's centre against the label's
      first line.

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

- [ ] **Audit verification time in every project** (2026-10-21,
      compratuentrada). Extend the existing `test-quality` audit to report cold
      and warm lint/format times, full test wall time and phase shares, slowest
      files, unnecessary DOM environments, coverage overhead, worker count and
      host load. Where the installed Vitest supports it, run `vitest doctor` on
      representative subsets as an opt-in diagnostic, record passing and failing
      candidates, and confirm any recommendation against the full suite before
      changing defaults. Compare equivalent runs before recommending a change;
      keep CI's cold checks and all tests and coverage thresholds. Evidence: in
      compratuentrada, cached ESLint fell from 188.41 s to 7.99 s and Prettier
      from 54.09 s to 14.69 s, while 991 Vitest files still took 357.11 s. A
      33-file `vitest doctor` sample recommended disabling isolation (9.01 s to
      4.76 s), but a three-worker variant failed; this is not proof for the full
      suite. Smallest next step: define a portable, read-only report for one
      consumer and validate its findings against this case before rolling it
      out.

- [~] **Remove stale root and template Knip hints** (2026-10-21). Root workspace
  configuration now passes `pnpm knip --treat-config-hints-as-errors` with all
  40 former hints removed; production strict mode also exits 0 and retains its
  two pre-existing warning-only binaries. CSS source patterns for Vite React,
  Vite Vue, Tauri and Nuxt now include CSS with production markers; four
  real-Knip regression fixtures failed before and the quality-config suite now
  passes 36 tests. Standalone Vite React strict mode retains one
  `eslint-config-prettier` compatibility-exemption hint. Smallest next step:
  reconcile that exemption against per-consumer ESLint loading without dropping
  compatibility for older shared configs; check the other standalone template
  gates as well. No package was published.

## Routed from `~/p/TODO.md` (2026-10-03)

Moved verbatim from `~/p/TODO.md` on 2026-10-03; the routing table in
`~/p/TODO_LOG.md` (entry of that date) records each move.

## Positioning and documentation (Codex value review, 2026-10-13)

- [ ] README hero still reads "Zero effort for you. Fewer tokens for them.",
      which `docs/evidence/2026-10-12-agent-token-measurement.md` refutes; the
      body below it was corrected on 2026-10-13. Smallest step: owner picks the
      new hero line and GitHub description, then update `README.md` line 5 and
      `docs/marketing/image-prompts.md`.
- [ ] Untested claims worth measuring, in Codex's order: blind human review time
      on strict vs original patches; a lighter cap/complexity/boundary gate
      against the full structural gate; first-run adoption on clean fixtures;
      per-rule false-positive rate in report-only mode. Smallest step: design
      the human review pilot (6-10 reviewers, paired patches).

## Rule precision and tooling roadmap (Codex tools review, 2026-10-13)

- [!] `patches/@stryker-mutator__vitest-runner@10.0.0.patch` restores mutation
  testing on Vitest 5 (`' > '` join, empty `describe('')` names kept). Blocked
  on upstream: 10.0.0 is still the latest release. Smallest step: drop it when a
  release fixing stryker-mutator/stryker-js#6210 ships and `pnpm mutation` still
  scores 89.98 or more without it.
