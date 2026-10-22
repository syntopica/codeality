### 2026-10-19

- [x] 2026-10-19 — **TypeScript 7:** the seven workspace packages type-check
      with the pinned native compiler instead of whatever global `tsc` the
      machine had.
  - Result: their `type-check` (and the plugin's declaration build) called a
    bare `tsc`, but `@typescript/typescript6` ships only `tsc6`, so it resolved
    to Homebrew's global TS 7.0.2 locally and to the runner image's global on
    CI, unpinned. Each package now declares `@typescript/native`
    (`npm:typescript@^7.0.2`) and calls
    `node node_modules/@typescript/native/bin/tsc`, the layout in
    `docs/typescript-7-migration.md`; `typescript` stays the 6.0.2 alias because
    TS 7.0 has no API and typescript-eslint allows `<6.1.0`.
  - Evidence: `pnpm run check:ci` exit 0; an injected `string` to `number`
    assignment in gate-kit fails `type-check` with TS2322.

### 2026-10-13

- [x] 2026-10-13 — **Release:** eslint-plugin-code-policy 0.9.0, eslint-config
      0.10.0, quality-config 0.14.0, db-quality 0.7.0, ui-quality 0.9.0,
      test-quality 0.2.0, create-baseline 0.10.6.
  - Result: estate sweep of the plugin build over 15 adopting repos found one
    false positive (`global-not-found.tsx` in tieneslavibra), fixed in 45107dd
    before publishing; the remaining new errors are the intended wider detection
    (verticagtm 19 and vexa-mail 9 `view-logic-separation` on vendored shadcn
    components, vexa-insight 1 dynamic `import()` deep import).
  - Evidence: f656967, annotated tags, publish runs 38350806895 to 38351172399
    green, `pnpm release:check` 9 packages fully released.

- [x] 2026-10-13 — **gate-kit / ui-quality:** Baselines catch a carried finding
      whose measured value grew.
  - Result: `horizontal-overflow` (`overflow-excess-px/v1`) and `a11y/*`
    (`affected-elements/v1`) carry a numeric measurement per screen, kept at the
    worst through grouping and merging and surfaced as `observed`/`threshold`;
    the baseline gains an optional validated `measurements` map, and
    `classifyFindings` takes a policy that fails a known finding risen past its
    tolerance (1 px, exact count) against the recorded value. Count-only
    baselines and DB stay unchanged.
  - Evidence: five CLI captures of one build gave identical values; end to end,
    +43 px exits 1 (`1 new (1 worse than recorded)`), +1 px exits 0; gate-kit 21
    and ui-quality 367 tests passed.
- [x] 2026-10-13 — **Templates:** `@tailwindcss/vite` moved to `devDependencies`
      in the three Vite templates.
  - Result: root `knip --production` reports no unused dependency.
  - Evidence: 43909aa; vue-app and vite-react-app build; per-template knip
    exit 0.

- [x] 2026-10-13 — **db-quality:** `--json` emits the shared diagnostics.
  - Result: `check`, `audit`, `gate`, `perf diff` and `perf bench` add
    `diagnostics` beside their existing fields; gate stages keep their findings
    and the top level flattens them in stage order; database findings
    (`postgres`, `supabase`) carry no location; `rerun` is a fixed command per
    producer, with `--db-url "$DB_URL"` instead of the URL.
  - Evidence: ef8b8bf; 525 db-quality tests passed.
- [x] 2026-10-13 — **quality-config:** `knip --production` reports real
      findings.
  - Result: presets mark runtime entries and sources with `!`, exclude tests,
    mocks and stories in production only, and ignore `astro`/`nuxt` in
    production only; `existingEntries` strips the mark; root config marks
    package and template sources. Root production run went from 22 dependency
    reports to 3, all `@tailwindcss/vite` (a build plugin declared in
    `dependencies`, a true finding left for the templates to decide); default
    run output identical.
  - Evidence: f412b33; `tests/knip.production.test.ts` runs real knip; 8
    templates exit 0 in default mode.
- [x] 2026-10-13 — **Docs:** warn-level suppression on adoption.
  - Result: `docs/adoption/existing-repo.md` says to keep the promotion to
    `error` in the config, with the override and `--suppress-rule` command;
    demoting back to `warn` brings the violations back.
  - Evidence: ESLint 10.12.0 `suppressions-service.js:246-258` counts severity 2
    only; scratch probe: warn `--suppress-all` wrote `{}`, error
    `--suppress-rule` exit 0, demoted to warn exit non-zero.
- [x] 2026-10-13 — **Stryker:** runner patch keeps empty `describe('')` names.
  - Result: the patch joins every suite name with `' > '` without filtering,
    which is the full name Vitest 5.0.3 matches (`" > leaf"` for an empty
    suite); `stryker.config.mjs` comment now says the run fails below
    `thresholds.break`.
  - Evidence: f6cea15; probe of Vitest 5.0.3 task chain; `pnpm mutation` 89.98,
    6.63 tests per mutant.

- [x] 2026-10-13 — **code-policy:** Rule precision fixes from the Codex tools
      review.
  - Result: exemptions match whole file names (`reindex.js`, `myindex.ts`,
    `homepage.tsx`, `myproxy.ts` no longer exempt; `.mjs`/`.mts` barrels
    recognised); `public-api-imports` and `no-cross-module-deep-imports` check
    `export from`, `export *` and literal `import()`, plus `allowedSubpaths`;
    `view-logic-separation` skips `useXxx` hooks and sees `React.useState`,
    `memo` and `forwardRef`; `one-primary-unit` message says at most one; five
    missing rule pages written; docs URLs point at this repository.
  - Evidence: dc8a74b; 289 plugin tests; `pnpm check:ci` passed.
- [x] 2026-10-13 — **Presets:** Distinct boundary preset and an atomic opt-out.
  - Result: `configs.boundaries` (three import rules) and
    `createCodeQualityConfig({ atomic: false })`; default unchanged.
  - Evidence: 8f06b56; `tests/configs.test.ts`; probe lint of one file gave four
    code-policy rules with `atomic: true`, only `public-api-imports` with false.
- [x] 2026-10-13 — **Baselines:** Occurrence counting in `classifyFindings`.
  - Result: each fingerprint occurrence beyond the recorded count is new, each
    fixed one is resolved; the value-growth gap stays open in TODO.md.
  - Evidence: cb35d97; `classifyFindings.worsening.test.ts`; db-quality 518 and
    ui-quality 359 tests pass.
- [x] 2026-10-13 — **Diagnostics:** Shared `Diagnostic` shape in gate-kit,
      emitted by `codeality-ui check --json` with a shell-quoted `rerun`.
  - Evidence: 016db46, 84c44ed; `report.test.ts`, `shellQuoted.test.ts` runs a
    hostile route through `sh -c` and gets it back verbatim.
- [-] 2026-10-13 — **Hooks:** Pipe oxlint before ESLint in pre-commit.
  - Resolution: measured on the ts-package template with lefthook 2.2.1: a
    failing file 0.5 s instead of 2.5 s, a clean file 2.2 s instead of 1.7 s;
    clean commits dominate, so the hook stays parallel. OXLINT.md records the
    numbers and the type-aware oxlint caveat (8457615).
- [x] 2026-10-13 — **Mutation testing:** Stryker scored 3% on Vitest 5 because
      the runner's test-name filter matched nothing (stryker-js#6210).
  - Result: pnpm patch joins names with ' > ' untrimmed; new contract tests kill
    new survivors.
  - Evidence: 83cc0a2, b9fbb96; `pnpm mutation` 89.98 (break 89), was 3.37.
- [x] 2026-10-13 — **Packaging:** `publish:check` lints with the packed tarball
      of `eslint-plugin-code-policy`, every preset as ESM and CJS.
  - Evidence: f56ff7f; deleting the `./configs/boundaries` export makes it fail
    with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- [x] 2026-10-13 — **Boundaries:** `createDepCruiserConfig({ moduleRoots })`
      judges cross-module imports on resolved paths.
  - Evidence: 37ffe8a; `moduleBoundaryRules.test.ts` cruises a fixture and gets
    exactly the deep import, not the index or same-module edges.
- [x] 2026-10-13 — **test-quality:** `check` reports DOM-free candidates as an
      observation; only `measure --node-candidates` fails on them.
  - Evidence: 436c95d; 43 tests including the CLI integration test.
- [-] 2026-10-13 — **Pilots:** TS7, Knip production, strict-boolean-expressions,
  Vitest related hook, bundled-CLI recipe.
  - Resolution: TS7 `tsc` already runs in the plain-TS templates through
    `@typescript/native`; Knip production mode moved to TODO.md (needs `!`
    entries); `strict-boolean-expressions` gave 59 reports in 1388 files, none a
    bug (each treats `''` as absent on purpose), so it stays off; a Vitest
    related hook is not added, since T4 measured no token saving from faster
    gates; the bundling recipe is in `docs/standards/code-quality.md`.

- [x] 2026-10-13 — **Docs:** Corrected the overclaims and stale facts the Codex
      value review found, except the README hero line.
  - Result: README body claims enforcement with its measured cost (no token or
    accuracy saving, unmeasured review and merge benefits, CI must be required);
    plugin README lists the eight recommended rules and their severities, says
    the presets are aliases, drops `@vibracomet`, describes `one-primary-unit`,
    placement and import rules by what they check; create-baseline README
    documents `--write` output, `--check`, `--fix` and exceptions; db-quality
    and ui-quality prose matches current behaviour; `@^0.1.0` install ranges
    removed; "thresacme" scrub artifact restored to "thresholded".
  - Evidence: `pnpm format:check` passes; claims checked against
    `src/configs/*.ts`, `src/utils/detect-file-kind.ts`,
    `bin/scaffold/writeMissing.mjs`, `src/model/Severity.ts`.

### 2026-10-12

- [x] 2026-10-12 — **ui-quality:** Rules for the defects found by eye on the
      InteliFactu Documentos list and Modelos casilla panel (owner report).
  - Result: nine new rules, `crowded-meta-line`, `date-locale`,
    `money-without-unit`, `list-dangling-rule`, `monospace-prose`,
    `unbreakable-overflow`, `redundant-total`, `label-wrap` (wrap half only) and
    `untranslated-text`; a new behaviour check `modal-dismiss` (backdrop click
    and Escape, reopened with the route's clicks); `fixed-overflow` extended to
    a sticky or fixed box taller than the space below its pin; `raw-placeholder`
    extended to identifiers (`taxRate`, `vat_rate`, `purchase:7905`).
    text-clipped missed the formula because it measures the element's box, not
    its glyphs, and stops at a scroller (a panel with `overflow-y: auto`
    computes `overflow-x: auto`). Probe reads `<html lang>`, the body font and
    `top`. Every rule is an error. The icon half of `label-wrap` and line-clamp
    stay open in `TODO.md`.
  - Evidence: `tests/cli.data-display.integration.test.ts` (one failing page and
    one near-miss twin per rule, 27 tests);
    `pnpm --filter @syntopica/ui-quality test` 100 files, 359 tests passed with
    coverage thresholds; `lint`, `type-check`, `lint:fast`, `dupes` and
    `prettier --check` clean.

### 2026-10-11

- [~] **`check:ci` queues behind a host admission wrapper.** Decided 2026-10-11
  (owner via Codex adjudication): one heavy suite per host, two test workers
  each. Evidence: `pnpm check:ci` exit 0 in 3 min 44 s through the wrapper (it
  delayed the start at load 18 on 16 threads), turbo
  `Tasks: 58 successful, 58 total`; `turbo run test --dry=json` lists the three
  variables under `globalCacheInputs` pass-through. Item stays open in `TODO.md`
  for the turbo concurrency question.

- [x] **ui-quality 0.8.0 released.** Approved by the owner on 2026-10-11 ("sí").
      Ships the error-only severity (breaking) and the `narrow-page`,
      `ragged-column` and `interaction-shift` rules. Release commit `17ee9d6`,
      annotated tag `ui-quality@0.8.0`, published by
      https://github.com/syntopica/codeality/actions/runs/38173478148 (OIDC
      trusted publishing, signed provenance). Evidence:
      `npm view @syntopica/ui-quality@0.8.0 version` prints `0.8.0`;
      `pnpm release:check` reports `ok @syntopica/ui-quality@0.8.0`. db-quality
      and test-quality stay unreleased: not approved.

- [x] **`narrow-page` threshold kept at 0.55.** Decided 2026-10-11 (owner via
      Codex adjudication, u2): keep `NARROW_PAGE_RATIO` at 0.55; a 960px data
      column at 1920px uses half the width, which is what the rule is for.
      Evidence: `src/rules/NARROW_PAGE_RATIO.ts` unchanged at 0.55;
      `pnpm exec vitest run tests/rules/narrowPage.test.ts tests/cli.narrow.integration.test.ts`
      in `packages/ui-quality`, 7 tests passed.

- [x] **Warning and info severities removed from test-quality.** Decided
      2026-10-11 (owner via Codex adjudication, u3): extend "no warnings, error
      or nothing" to test-quality. Inventory: `warning` from
      `duplicate-file-run`, `dom-environment-unused` (check and measure),
      `uncached-hook-lint`, `environment-dominates`; `info` from `suite-run`,
      `slowest-files`, `memory-use`, `hook-runs-full-gate`. The one consumer of
      the field inside the package was `writeFindings`, which failed the command
      on a warning; outside it, verticagtm and career-hub run
      `codeality-test check` for its exit code. The split: a reading that names
      something to change is a finding, now `error`; a reading that asks for no
      change (timings, memory, and what a hook runs, which the rule itself
      documents as "not a defect on its own") is an `Observation` with no
      severity, in its own `observations` list and `src/observations/`. JSON
      moves to `schemaVersion: 2`; exit codes are unchanged. Evidence:
      `pnpm turbo run type-check lint test build --filter=@syntopica/test-quality --force`,
      43 tests passed.

- [x] **Warning severity removed from db-quality.** Decided 2026-10-11 (owner
      via Codex adjudication, u3): extend "no warnings, error or nothing" to
      db-quality. Inventory: 26 emitters of `warn` (the five Supabase SQL rules,
      prisma-lint, three Kysely migration rules, `BDB403`-`BDB406`,
      `BDB601`/`BDB602`, five PostgREST rules, perf `BDB902`-`BDB904`, bench
      `BDB913`, squawk warnings, advisor `WARN`/`INFO` through
      `ADVISOR_SEVERITY`, Soda `warn` outcomes); no consumer read the field: the
      gate already failed on any finding, the text renderer omits it, the
      fingerprint excludes it, and the five consumer repos (vexa, verticagtm,
      compratuentrada, teapartydolls, atrium) call the CLI for its exit code.
      All were actionable findings, so all became `error`; `Severity` is
      `'error'` alone and `ADVISOR_SEVERITY` is deleted. Measurements (the bench
      record's medians, the perf snapshot) were never findings and carry no
      severity. Evidence:
      `pnpm turbo run type-check lint test build --filter=@syntopica/db-quality --force`,
      518 tests passed.

- [x] **A whole page capped narrow on a wide screen (2026-10-09), shipped as
      `narrow-page`.** Decided 2026-10-11 (owner via Codex adjudication):
      trigger on wide viewports when the main content is materially capped and
      leaves unused space beside it, prose measure excluded. At 1600px up, the
      ink of the main region spanning under 55% of the viewport less any side
      panel (siblings of main or its ancestors sharing its row), on a page with
      a card-like surface without fields or a data layout; a data page that
      `content-width` already reports is skipped. Threshold from measurements of
      every fixture at 1600 and 1920px: the `max-w-4xl` report 51% / 43%, a
      1280px container 75% / 63%, 960px pages 60% / 50%. Evidence:
      `tests/rules/narrowPage.test.ts` (6),
      `tests/cli.narrow.integration.test.ts` on `narrow.html` (both widths),
      `narrow-clean.html` and `narrow-reading.html` (none).
- [x] **Warning severity removed from ui-quality.** Decided 2026-10-11 (owner):
      no warnings, error or nothing. `Severity` is `'error'` alone; the 58 rules
      and check findings that warned now error, `WARN_BEHAVIOURS` and
      `BLOCKING_IMPACTS` (axe `moderate`/`minor` as warnings) are deleted, and
      the "advisory" wording is gone from the AI-tell rules and docs. `check`
      already exited 1 on any finding, so the gate's exit code is unchanged;
      only the reported severity is. Release left to the owner (`TODO.md`).

- [x] **`ragged-column` (candidate 2026-10-08/09)**: a block in the main region
      that starts on its column's left edge, sits alone in its row next to a
      block filling the column, and ends over 15% of the column short while its
      edge shows (border, shadow, distinct fill, or text wrapping there).
      Paragraphs keep their measure unless the full-width neighbour is a card;
      tables are left out. No probe change: the snapshot already carries boxes,
      padding, lines and fills. A first cut, judging box width alone, reported
      the `<table>` of `table.html` and broke 4 integration tests; requiring a
      visible edge fixed that. Evidence: `tests/rules/raggedColumn.test.ts` (6),
      `tests/cli.ragged.integration.test.ts` on `ragged.html` and its clean
      twin.
- [x] **`interaction-shift` (candidate 2026-10-09)**: a behaviour check run with
      the others on the first screen of each route. Every `role=group` of
      `aria-pressed` buttons in the main region (4 groups, 6 options at most) is
      pressed through; the nearest sticky or surface ancestor's height is read
      after each press, a spread over 4px is reported at `warn`, and the option
      on before is pressed again. Evidence:
      `tests/behaviour/interactionShiftFailureOf.test.ts`,
      `tests/cli.shift.integration.test.ts` on `shift.html` (a filter row shown
      with `display`) and its twin (`visibility`). The page-wide narrow cap and
      tabs stay in `TODO.md`.
- [x] Moved four items already closed and verified earlier out of the active
      backlog: `ui-quality@0.2.0` published 2026-10-07 (run 37538934323, after
      recreating the expired trusted publisher); axe no longer hangs on a
      script-less sandboxed `srcdoc` frame (2026-10-06, `axe.exclude`,
      `axe.timeoutMs`, `tests/cli.desktop-shell.integration.test.ts`);
      `icon-contrast` reads the `html`/`body` fills (2026-10-06,
      `tests/rules/iconContrastCanvas.test.ts`); config `initScripts` for a
      desktop-shell IPC stub (2026-10-06, the desktop-shell integration test).

- [x] **`runKyselyTypeDrift` timed out under load and left temp dirs behind**:
      the suite now runs with a 60 s timeout, and its projects live under
      `node_modules/.cache/db-quality-drift/` (removed in `afterAll`) instead of
      `tests/.tmp-drift-*`, which a killed run left for the next lint to trip
      on. Evidence: the test failed 3 of 5 full local gates at load 70-87 before
      the change; passes alone and in the gate after it.

### 2026-10-08

- [x] **Kysely type drift (`BDB330`)**: `audit --db-url` compares the live
      schema (kysely-codegen 0.20.0 via npx) with `kysely.databaseType` through
      the project's TypeScript; `kysely.databaseTypeIgnores` for tables kept out
      on purpose. Evidence: db-quality 512 tests, `pnpm check:ci` green; live
      against compratuentrada (local PostgreSQL, 17 migrations): 1 true finding
      (`membership.scope_type` varchar declared as a literal union), and an
      added table, added column, renamed column and dropped `NOT NULL` each
      reported. Code generated on max-lane (Sonnet).

- [x] ui-quality 0.7.0 published (run 37693554087, tag pushed): every remaining
      candidate in `docs/rule-candidates.md` shipped, 29 rules at `warn` (tier 2
      rest and tier 3), none rejected; `label-punctuation` opt-in through the
      new `enable` list. Deviations from the first triggers are recorded in the
      doc (`purple-gradient` from hue 270, `id-first-column` opaque ids only).
      Evidence: 93 files, 315 tests; a scan of every fixture at 1440/390, light
      and dark, found no clean fixture newly reporting; `pnpm check:ci` exit 0
      on the released tree (9b3fec7..947ee07).

### 2026-10-07

- [x] Python consumers, fourth pass (owner-approved; gates re-run on clean
      `origin` worktrees, exit 0): DJCenterDeluxe 28 to 4 (a440988): 280
      characterisation tests first (232364c), then the 8 large classes split,
      the `veoplan`, `scrapers/goldwing` and `spotify` scripts moved to
      `python -m` (86508ce), spiders renamed, coverage floor 36 to 65.
      djplayerdeluxe 44 to 39 (97ecfd1): `fileman`, `djpd` and `djpdplayer`
      split behind their tests, `fileman` typed, floor 38 to 65.

- [x] Release (64ef582, annotated tags pushed): `@syntopica/ui-quality@0.6.0`
      (tier 2 start, layout-shift read fix, run 37683250803),
      `@syntopica/quality-config@0.13.1` (knip preset hints, run 37683149534),
      `@syntopica/create-baseline@0.10.3` pinning it (run 37683341911).
      `pnpm check:ci` exit 0 before tagging; `pnpm release:check` exit 0.

- [x] ui-quality tier 2 opened (unreleased): `focus-invisible` from a keyboard
      Tab pass (7c630e6), `touch-target` on phone screens (40328df),
      `radius-sprawl` and opt-in `card-radius-admin` (3c5f62d). The composition
      integration test lost `unstable-media-size` under a loaded `check:ci`: the
      layout-shift total was read before the observer's callback ran; the getter
      now takes queued records first (e76b2be; three parallel suites 240/240,
      `pnpm check:ci` exit 0). quality-config: the knip preset no longer leaves
      configuration hints in CLI consumers such as jobradar (c98cfcb,
      unreleased).

- [x] Python consumers, third pass (gates re-run on clean `origin` worktrees,
      all exit 0): agent-deluxe 8 to 0 and `[mypy-agent]` gone, floor 35 to 42
      (5602689; dcb3802 and 7a40a27 tracked the `invoice_agents/logs/` package
      that `.gitignore`'s `logs/` had hidden, so a clean checkout failed to
      import); qlctool 4 to 0 (ad31c82); atrium 2 to 0 (2261ed5, `--help`
      byte-identical); DJCenterDeluxe 55 to 28 (b0e6d72); djplayerdeluxe 51 to
      44, `utils` renamed `runtime_services` (6f27e82). wiki gate green on 0.2.5
      (0dd884007: six one-liner scripts in `tools/` made entrypoints).

- [x] teapartydolls#55 merged and deployed (Workers Builds green, site 200).
      jobradar: boards committed (3c163f2), every dependency to latest
      (5092741), five dev-tool advisories overridden and braces
      GHSA-vfj7-8cjw-p6xm waived until 2027-01-07 (e70323b); `check:ci` and
      `check:security` exit 0.

- [x] code-policy 0.8.0 adoption, the six left (no suppressions): contratica 786
      named (67c2acd8, `pnpm check:all` green, 540 tests), inpractise-demo 85
      (06be819), jobradar 11 (51eadb1) and ventanilla-unica 89 (cc7edf1, 1343
      tests), both committed from a worktree beside another session's dirty
      dependency edits; teapartydolls 80 in PR #55. livesalescoach 2d9afc5 gave
      the two `no-console` lines a reasoned disable (its logger prints only in
      development). Mains.World#699 and PXPN.dev#266 merged; the pxpn Worker
      deployed. contratos was retired: the checkouts were removed on both Macs
      and archived in `~/Archive/contratos-2026-10-07*`.

- [x] Python consumers on codeality-py 0.2.5 (every gate exit 0, pushed): brain,
      clips, memory-bench, syntopica, atrium, worker, djplayerdeluxe,
      DeluxeServerTools (urllib3 2.8.0), qlctool 6 to 4, agent-deluxe 9 to 8
      (`__main__.py` as entrypoint). agent-deluxe 36a77b5 ports the browser code
      to browser-use 0.5.9 (`BrowserProfile`/`BrowserSession`; the old kwargs
      were silently dropped). DJCenterDeluxe 4e1fe3f moved 52 inline queries to
      `sql/queries/` (BPY006 56 to 4) and c19e24d typed
      `holded_invoices_handler` (ignore list 35 to 0); baseline 114 to 55.

- [x] Estate adoption of `eslint-plugin-code-policy@0.8.0`, 20 repos, each
      through its own gate (failures left were present on a clean HEAD) and
      pushed. Fixed with named types: busirocket cfb7ee4, capture e8423bd,
      cristiandeluxe-dev e865a27, livesalescoach 64d8b25 (`--no-verify` over two
      old `no-console` errors), dj-rocket 3efd39b3, calculadora 57d3036,
      nubenode-web 2c95681, pxpn 542e301 (PR #266). Recorded with
      `eslint --suppress-rule code-policy/no-inline-types-in-runtime-files`:
      verticagtm 59cb6fae, tieneslavibra 1d9df473, agents 3e178dfc, 10xjoy
      74dbb29, vexa-mail bae6324, pridefamilymedicine 622585d, clips ad5cfe2,
      vexa a5cf47d8, inbox-companion 1b28b8b, vexa-insight 178ac04, Mains.World
      34018a84 (PR #699, 941 findings). wiki 9ecfed31d had none. Pinned
      typescript-eslint 8.71.0 where 8.71.1 broke JS files: wiki,
      livesalescoach, inbox-companion, dj-rocket, calculadora, nubenode-web (and
      contratos). Remainder in TODO.md.

- [x] Python consumer backlog, first pass (all pushed, each repo's
      `uv run codeality-py gate` exit 0): atrium 19 to 2 findings, coverage
      floor 54 to 80 (b3b09c6); agent-deluxe 26 to 9, `ignore_errors` 12 to 2,
      floor 9 to 35, oauthlib 4.0.0 for pip-audit (09e42b0); qlctool
      `ignore_errors` 26 to 0, floor 85 to 95 (cd7412c); djplayerdeluxe 64 to
      51, 51 to 29, floor 5 to 38 (af55eda on `master`; 54c3c7e alone does not
      import); DJCenterDeluxe 194 to 114, 36 to 2, floor 35 to 36 (13492fd).
      Remainder moved to a second-pass item in TODO.md.

- [x] codeality-py 0.2.5: three defects the backlog pass found. `BPY002` kept no
      underscore after a one-letter word (`is_a_step` to `is_astep.py`), cut
      plural acronyms (`URLs` to `ur_ls.py`), and `BPY001` reported an
      `entrypoint` `__main__.py` that only calls an imported function. Evidence:
      248 tests, `codeality-py gate --project packages/codeality-py` exit 0.

- [x] Kysely acceptance on `~/p/compratuentrada` (cloned from
      Vibra-Lab/compratuentrada): 668975b adopted db-quality 0.5.0 (code rules,
      `db:gate` in `check:ci`) and found four defects, fixed in 0424e1a and
      released as db-quality 0.5.1 (run 37661512203, tag pushed; ui-quality
      0.5.0 in run 37661517593): tsconfig path aliases for migrations,
      PostgreSQL-only squawk type advice excluded with several dialects,
      `dynamic-raw-sql` follows literal arrays, const tuples and literal types,
      `init` proposes the Supabase workflow only with a `supabase/` directory.
      f6d0904 there enables the migration checks: 17 migrations hashed, 101
      squawk findings on them baselined (317 before the fix), gate exit 0;
      `delete-without-where` and `migration-edited` both fire on deliberate,
      reverted violations; `pnpm check:ci` exit 0. Vibra-Lab Actions did not
      start (billing or spending limit; run 37658901628).

- [x] ui-quality tier 1 closed: `nested-cards`, `type-scale-sprawl`,
      `accent-overuse` (new `palette.accent`), `text-occlusion`, the
      layout-shift half of `unstable-media-size` (init-script observer, total
      over 0.1) and the CSS-background half of `broken-image` (failed image
      requests). All warn; a scan of every existing fixture at 1440/390, light
      and dark, found none outside the new defect page. Evidence: ui-quality
      `test` 69 files, 224 tests; `cli.composition.integration.test.ts`;
      `pnpm check:ci` exit 0.

- [x] Release 2026-10-07 (5e450b3, annotated tags pushed): published
      `@syntopica/quality-config@0.13.0` (`baseline-hooks-install`),
      `@syntopica/db-quality@0.5.0` (Kysely, perf previous window),
      `@syntopica/ui-quality@0.4.0` (tier 1 rules, scroll/hover/focus),
      `@syntopica/test-quality@0.1.2` and `@syntopica/create-baseline@0.10.2`
      (pins quality-config 0.13.0), runs 37656818849, 37656823210, 37656827665,
      37656832386, 37656932686. `pnpm check:ci` exit 0 before tagging;
      `pnpm release:check` all ok once the registry caught up (the packuments
      lagged a few minutes behind the green runs). The first `check:ci` failed
      on test-quality's own integration test: `duplicate-file-run` listed
      projects in the order vitest finished collecting them (`node, dom` vs
      `dom, node`); the evidence is now sorted, with a unit test.
- [x] Push of 92360a5 (Kysely) was rejected with GitHub
      `Internal Server     Error` six times over ~3 minutes (request
      F592:1ACBE8:32C91B:396F21:6AC6792A) while githubstatus.com reported all
      operational; it went through unchanged a few minutes later. Transient, no
      repository cause.

- [x] ui-quality interaction states: `routes[].scroll` (`"bottom"` or a
      selector), `routes[].hover` and `routes[].focus` measure the screen in
      that state after the clicks, the screenshot keeps it, and a missing target
      is a `click-failed` finding naming the action (a click keeps its bare
      selector identity, so baselines still match). Evidence:
      `tests/cli.states.integration.test.ts`.
- [x] ui-quality tier 1 rules (warn): `undersized-text`, `tight-leading` (24px
      and up exempt), `letter-spacing`, `numeric-alignment` (canvas test for
      fonts whose digits are already tabular), `broken-image`,
      `unstable-media-size`, `content-hidden-at-rest`; probe gained line height,
      tracking, weight, family, numeric variant, alignment, transform, line
      count, radius, padding, a media list and hidden-text counts. The sizing
      check inserts and removes a source-less copy of the media synchronously,
      the probe's one page mutation. Evidence: ui-quality `lint`, `type-check`,
      `test` (64 files, 206 tests) exit 0; `cli.typography.integration.test.ts`
      runs a defect page and its clean twin; `pnpm dupes` 0.49%.

- [x] db-quality `perf diff` compares against the previous window, not the
      cumulative mean since the stats reset. Codex adjudication
      (`codex exec -s read-only`, option A, confidence high): `perf snapshot`
      over an earlier snapshot records each statement's `windowMeanMs`
      (additive, `schemaVersion` stays 1 so older snapshots and tools keep
      working), `windowStatements` judges against it through `referenceMeanOf`,
      the gate stays read-only, and the CI secret wiring is dropped because the
      owner keeps perf local. Evidence: `tests/perf/withWindowMeans.test.ts` (31
      ms after a recent 30 ms window is no regression; the cumulative 16.7 ms
      read +86%) and the snapshot-over-snapshot case in `perfCommand.test.ts`;
      db-quality `vitest run tests/perf tests/commands` 33 passed, eslint and
      `tsc` clean.

- [x] Template `prepare` race on `.git/hooks`: new `baseline-hooks-install` bin
      in quality-config runs `lefthook install` only when the package is the git
      repository root, and all eight templates use it in `prepare`.
      `pnpm install --force` now reports each template as nested in the
      repository root and skipped, and only the root syncs the hooks; a
      standalone git repo still gets its hooks, a non-git directory exits 0.
      `lefthook` joined the runner dependency lists in both knip configs. Needs
      a quality-config minor release before a copied template can resolve the
      bin. Evidence: `pnpm knip`, `pnpm lint:root`, quality-config `lint`,
      `type-check`, `publish:check` all exit 0.

- [x] Published the releases blocked on expired npm trusted publishers:
      `eslint-plugin-code-policy@0.8.0`, `@syntopica/eslint-config@0.9.0`,
      `@syntopica/tsconfig@0.3.1`, `@syntopica/prettier-config@0.2.2` and
      `@syntopica/create-baseline@0.10.1`. Each trusted publisher was deleted
      and recreated on npmjs.com (syntopica/codeality, publish.yml, no
      environment, npm publish) through chrome-cli, the owner confirming each
      write with a security key, then published from its tag with
      `gh workflow run publish.yml --ref <pkg>@<version>`. prettier-config 0.2.1
      and create-baseline 0.10.0 were superseded before publishing (0.2.2 keeps
      AGENTS.md/CLAUDE.md line breaks for next dev's agent block). Evidence:
      `pnpm release:check` reports all 9 packages ok.

- [x] ui-quality `ghost-elevation` (warn): owner said yes and asked for Codex;
      Codex (`codex exec -s read-only`, verdict D1 option B, confidence high)
      chose reporting only shadows larger than shadcn's default. Probe field
      `shadowBlur` (widest visible outer blur); the rule fires on a box with a
      full visible border, blur over `GHOST_SHADOW_BLUR` (3px, Tailwind
      shadow-sm) and no fixed/absolute ancestor or dialog. Evidence:
      `cli.elevation.integration.test.ts` reports only `main > section.ghost`;
      threshold 1000 drops it, threshold 0 adds `section.resting` while the
      popover stays excluded.
- [x] verticagtm: removed the `vitest@<4.1.11` and `@vitest/mocker@<4.1.11`
      overrides (Codex D3 option A, confidence high). They rewrote the vitest
      peer ranges of test-quality, jest-dom and @vitest/eslint-plugin to 4.1.11
      against a direct `vitest@^5.0.3`. `pnpm peers check` no longer lists
      vitest; `pnpm check:ci` exit 0; verticagtm da9c36b8 pushed. Codex D2
      (option A, medium) confirmed publishing eslint-plugin-code-policy 0.8.0 at
      error severity.

- [x] Release 2026-10-07 (b4a0c2f, annotated tags pushed): published
      `@syntopica/ui-quality@0.3.0`, `@syntopica/db-quality@0.4.0` and
      `@syntopica/quality-config@0.12.1` (runs 37631196044, 37631206196,
      37631172774; `npm view` confirms). `pnpm check:ci` exit 0 before tagging.
      CI had been red since 76f88d7 on jscpd duplication (1.4% over 1%); 5110a09
      moved eleven ui-quality CLI tests onto `tests/fixtureFindings.ts`,
      duplication 0.67%.

- [x] ui-quality `duplicate-nav-icon` (warn): links or buttons under `nav` whose
      first svg has the same markup digest (djb2 of the svg with
      class/style/size/id/aria attributes removed) and different names
      (aria-label or text) are reported once per icon. Evidence:
      `cli.icons.integration.test.ts` reports `Clientes / Contactos` (same icon
      at 20px and 24px) and not Plantillas.
- [x] ui-quality `mixed-icon-family` (warn): a repeated sibling group outside
      `nav` whose items each draw exactly one svg mixes filled and stroke-only
      first shapes (computed `fill`/`stroke`). Navigation is excluded because a
      filled icon there usually marks the active entry. Evidence: same
      integration test reports the solid WhatsApp glyph beside the outline
      envelope (`main > ul`).
- [x] ui-quality `transition-all` (warn): `transition-property: all` with a
      non-zero duration, one finding per element signature. Evidence:
      `cli.icons.integration.test.ts` reports `main > div.card`; ui-quality 191
      tests pass. `ghost-elevation` from the same item is parked `[!]` for an
      owner decision (shadcn's default Card/Input are border plus shadow).

- [x] ui-quality `oversized-list` landed as `pagination-missing` on lists: a
      main region with no table whose largest repeated collection holds over 150
      items (`MAX_UNPAGED_ITEMS`) and shows no next-page control is reported as
      `pagination-missing main list`, next to the table's 300-row rule.
      Evidence: fixture `list.html` (200 conversations reported, `#short` 20
      not), `unpagedFailureOf.test.ts`; ui-quality 190 tests.

- [x] ui-quality `placeholder-fit` (warn): an empty field whose placeholder
      (canvas `measureText` with the computed font) is over 20% wider than its
      content box (client width less horizontal padding). Probe gains
      `contentWidth` and `placeholderWidth`. Evidence:
      `cli.placeholder.integration.test.ts` reports only the 160px field with a
      long hint (not the short hint, not the filled field);
      `placeholderFit.test.ts`; ui-quality 188 tests.

- [~] ui-quality `empty-dialog` (warn): an open `dialog[open]`,
  dialog/alertdialog role or `aria-modal` element with no link, button or field
  besides a close control (by text or `aria-label`: close, cerrar, cancel, ×).
  Probe gains `isDialog` and `label`. Evidence: `cli.dialog.integration.test.ts`
  (drawer opened by `routes[].click`, reported with `#empty`, passed with its
  links), `emptyDialog.test.ts`; ui-quality 185 tests. The interaction-states
  item stays open for scroll and hover/focus capture.
- [x] ui-quality `check` reads `baseUrl/sitemap.xml` (one level of a sitemap
      index, up to 10 children, 10 s timeout, file: URLs too) and reports
      `route-uncovered` (warn) once per first-segment template (`/artistas/*`,
      `/legal`) that no configured route renders; skipped under `--routes` and
      when there is no sitemap. Evidence: `cli.sitemap.integration.test.ts`
      (home configured, artist pages and legal page reported, nothing with
      `--routes`), `routeTemplate.test.ts`; ui-quality 177 tests pass.

- [x] ui-quality `text-clipped` reports a select whose content box (client
      height less vertical padding) is over 1px shorter than one line of its
      font (canvas `fontBoundingBox` ascent+descent, probed for selects only).
      Confirmed first in Chromium that it clips the option text to the content
      box (28px select with 9px padding: text cut top and bottom). Evidence:
      `cli.select.integration.test.ts` (tight select reported with a 10px box,
      roomy one not), unit case in `textClipped.test.ts`; ui-quality 173 tests
      pass.

- [x] ui-quality reports `dark-scheme-ignored` (warn, once per run) when a dark
      screenshot is byte-identical to its light twin (`screenshotDigest`,
      SHA-256 of the capture), naming how many screens and which routes, and
      pointing at `routes[].localStorage`/init scripts or dropping `dark`.
      Evidence: `schemeDuplicateFinding.test.ts`;
      `cli.dark-scheme.integration.test.ts` (fixed.html with both schemes
      reports it, broken.html with a dark stylesheet does not); ui-quality 171
      tests pass. Integration fixtures without dark styles now run light only.

- [x] ui-quality turns on axe's `target-size` (WCAG 2.2 AA 2.5.8): axe-core 4.13
      ships it `enabled: false`, so the default `AxeBuilder` run never reported
      it; now enabled through run options (`AXE_OPT_IN_RULES`). Evidence:
      `cli.target-size.integration.test.ts` reports `a11y/target-size` on two
      touching 16px buttons and fails with the option removed; it also caught a
      19.6px `<summary>` in the clean `fixed.html` fixture, padded to 24px+.
      ui-quality 167 tests pass. Consumers will see new `a11y/target-size`
      findings on upgrade: note it in the CHANGELOG.

- [x] ui-quality grid pagination ignores a "next" link whose address leaves the
      route (`isPagerAddress`: same path with another query, or a path below it)
      unless a numbered "2" link backs it. Evidence: new fixture `article.html`
      -> `article-next.html` with the same related posts gives no finding, and
      `pagination-broken` with the guard disabled; `isPagerAddress.test.ts`;
      ui-quality 166 tests, lint, type-check clean.

- [x] ui-quality `content-width` only measures a main region with a data layout
      (`hasDataLayout`: a `table`, or 3+ same-tag siblings that each have parts
      and no prose paragraph of 200+ characters or text field, `isRowItem`).
      Evidence: `contentWidth.test.ts` reports a narrow table and a narrow list
      of rows, and leaves a 720px prose column and a 448px three-field form
      alone; ui-quality 163 tests, lint, type-check clean.

- [x] ui-quality `check --routes <glob>` measures only the matching routes
      (`node:path` `matchesGlob`, extglob such as `'/!(admin)**'` works) and
      skips the up-front credential check; a selected route that bounces to the
      login still fails with the missing-variable error, and a glob matching
      nothing is exit 2. Evidence: `tests/cli.routes.integration.test.ts` (4
      cases); ui-quality 161 tests, lint, type-check clean.

- [x] ui-quality `disable` entries take `message`, a substring the finding's
      message must contain, so one third-party `console-error` (Turnstile's
      picture-in-picture violation) is kept without disabling the rule on the
      route. Evidence: `tests/config/isDisabled.test.ts` (message match and
      mismatch), config parse test; ui-quality 157 tests, lint, type-check
      clean.
- [x] ui-quality `slow-request` per-request disable: already possible, now
      documented. The finding's subject is the request (`POST /api/track`), so
      `disable[].selector` matches its URL, and the new `message` field matches
      anything in the message. A server action is named only by its Next.js
      action id; the function name (`trackRosterAccess`) never reaches the
      browser, so matching by name is not possible from the capture.

- [x] db-quality passes every file it writes (`codeality-db.json`,
      `package.json`, bench README, `.codeality-db-bench.json`,
      `.codeality-db-perf.json`) through the project's own
      `prettier --write --ignore-unknown` (`runProjectPrettier`); no Prettier
      means files stay as written. Evidence:
      `initCommand.prettier.integration.test.ts` (printWidth 40, proseWrap
      always) passes and fails with the call disabled; db-quality 348 tests,
      lint, type-check clean.

- [x] `no-inline-types-in-runtime-files` reports anonymous object types in
      runtime code (annotations, assertions, parameters, return types, type
      arguments; outermost literal only; `declare global`/`declare module`
      exempt) as `anonymousTypeLiteral`. It found 28 in this repo's packages and
      1 in `templates/nextjs-app/app/layout.tsx`, all extracted to named type
      files. Evidence: rule tests 30 pass (8 new), `pnpm check:ci` 56/56 tasks,
      `pnpm check:quality` 6 gates. Estate impact not measured yet: sweep the
      adopting repos before publishing the plugin, since
      `({ children }: { children: ReactNode })` is a common shape.

- [x] db-quality `sqlite.queries` follow-ups (Vexa): `exclude` root-relative
      globs (`readQueryFiles` via `node:path` `matchesGlob`, validated in
      `sqliteQueriesSectionFrom`), and with `database` set a BDB404 whose
      statement plans with no scan is dropped (`planScansNothing`,
      `dropIndexedGuards`). Evidence: integration fixture `jobs_guarded.sql`
      reports BDB404 statically and none with dev.db (test fails with the drop
      disabled); exclude test returns []; db-quality 347 tests pass, lint and
      type-check clean.
- [x] db-quality BDB406 no longer reports a `DELETE`/`UPDATE` with no `WHERE`
      (`isWholeTableWrite`, skipped in `queryPlanFindings`). Evidence: fixtures
      `DELETE FROM jobs;` and `UPDATE jobs SET state = 'a';` against a 2000-row
      table produce no finding; unit test `isWholeTableWrite.test.ts`.

- [x] ui-quality `listOfTable` reads the header as textContent, the text
      `hasText` matches. The cause was not the tab-joined cells as filed: React
      renders `<th>`s with no whitespace between them, so textContent is
      `NivelDígitos...` and the innerText `Nivel<TAB>Dígitos` normalised to
      `Nivel Dígitos` matched no table. Fixture `table.html#broken-tight`:
      before `empty-state-missing`, after `filter-broken` (the real defect).
- [x] ui-quality login takes the first visible element of the first selector
      alternative that has one (`firstInSelectorOrder`), for username, password
      and submit. Fixtures `login.html` (off-screen honeypot first) and
      `gate.html`: before `page.waitForURL: Timeout 30000ms exceeded`, after
      exit 0. css-what was tried for the splitting and rejected: it rewrites
      `:has-text("a, b")` and throws on `>>`.
- [x] ui-quality retries a screen once and records a `capture-failed` finding
      when both attempts fail; ConfigError and a closed browser/page still end
      the run (exit 2/3). The page is parked on about:blank after each failure:
      Chromium's own error-page navigation otherwise interrupted the next
      route's `goto`. Test: `/missing.html` then `/fixed.html` gives one
      `capture-failed` and the fixed screenshot.

- [x] `@syntopica/eslint-config`: the four peers `/code-quality` imports
      unconditionally (`@vitest/eslint-plugin`, `eslint-plugin-testing-library`,
      `eslint-plugin-sonarjs`, `eslint-plugin-code-policy`) are no longer
      optional, so `auto-install-peers` installs them and a plain install warns,
      instead of ESLint dying at config load. README says why.
- [x] `react/prop-types` off for `**/*.{ts,tsx}` in the nextjs and vite-react
      layers. A/B on a shadcn-style `forwardRef` `TableCell` in each template:
      before `'className' is missing in props validation`, after 0.
- [x] knip on the templates: `gitleaks` is ignored by default in
      `createKnipConfig` (the baseline writes it into every `secrets:check`; all
      eight templates reported it unlisted), the nextjs preset drops
      `{,src/}{middleware,proxy}.ts` (knip's Next plugin registers both) and the
      Vite presets drop `src/main.*` (reached through index.html). A dead file
      in vite-react still reports. Remaining hints are the documented
      `ignoreDependencies` ones.
- [x] knip 6.35 and `vite.config.ts`'s default export: fixed on 2026-09-21
      (`46bf2e3`), every framework-owned preset sets
      `includeEntryExports:     false`; `pnpm knip:templates` green on knip
      6.40.
- [x] commitlint and `todo:`: backlog commits are `docs(todo):`, documented in
      `docs/standards/quality-gates.md` (`todo` would need a changelog mapping
      for a change with nothing to release).
- [x] `docs/adoption/existing-repo.md` gains "The first `check:ci` on a
      repository older than the baseline": TS4111 sweep, tool directories out of
      Prettier/ESLint, the suppressions ratchet, and the knip findings.
- [x] CI follow-ups after the Chromium fix: the drizzle ESLint integration test
      gets 60 s (cold ESLint passed 5 s on the runner), and zizmor's
      `ref-version-mismatch` on `upload-artifact` (`# v7` on a v7.0.1 commit) is
      fixed in the python template and in codeality-py's CI asset.

- [x] cargo-baseline passes its own check again: `child_paths` moved to
      `src/engine/child_paths.rs`.
      `cargo run -p cargo-baseline -- baseline     check` 0 errors, `cargo test`
      100 passed, clippy `-D warnings` clean.
- [x] `pnpm audit:check` green: 0 unwaived of 10. Expiring waivers (2026-12-31)
      for the advisories with no usable fix - node-forge, braces, sprintf-js (no
      patched release) and four simple-git ones. Forcing simple-git 4 was tried
      and reverted: @nuxt/devtools 3.4.2 does `import Git from 'simple-git'` and
      4.x has no default export (`m.default is not a function`), so `nuxt dev`
      would break.
- [x] Every JS template ships a `.baseline-advisories.json` with only the no-fix
      advisories its own tree reaches, and `docs/adoption/new-repo.md` gives the
      three overrides (tmp, basic-ftp, @puppeteer/browsers) for the fixable ones
      under @lhci/cli. Measured on a fresh resolution of each template outside
      the workspace (published @syntopica versions):
      `baseline-audit --level moderate` 0 unwaived in all eight.
- [x] `check:ci` vs `check:security`: kept apart on purpose (advisories land
      daily, an audit in `check:ci` turns an unchanged commit red overnight);
      documented in `docs/adoption/new-repo.md` with `pnpm check:security` as
      the local pre-release step.
- [x] Wrong plugin name and `onlyBuiltDependencies` in README/templates: already
      gone - no `@syntopica/eslint-plugin-code-policy` or
      `onlyBuiltDependencies` left in packages, templates, docs or README (grep
      2026-10-07).
- [x] Test files and `check:ci` lint: every template keeps its tests under
      `src/` (or `app/`, `server/` for nuxt, linted with `eslint .`), which its
      `lint` script already covers. The gap was compratuentrada's own layout.
- [-] `@eslint/js@10` against eslint 9: obsolete, the estate and every template
  are on eslint 10.12.
- [x] CI red on `main` since 2026-09-26, three causes: (1) `check:ci` -
      ui-quality's integration tests exited 3 with an empty report because the
      Verify job never installed Playwright's Chromium; ci.yml now runs
      `playwright install --with-deps chromium`. (2) `check:quality` - depcruise
      `no-orphans` on ~40 files imported only through `@/`: db-quality,
      test-quality and ui-quality alias `@/` but were missing from
      `scripts/aliasedWorkspaces.mjs`; `pnpm check:quality` 6 gates passed. (3)
      `audit:check`, see the waivers entry.

### 2026-10-04

- [x] `quality-config@0.12.0` tag added at f6c7239 (the bump commit, 05:24Z;
      publish run 37179879613, npm 05:28Z; no later change to the package).
      `pnpm release:check`: 9 packages fully released.
- [x] `@syntopica/test-quality` 0.1.0 and `@syntopica/ui-quality` 0.1.0 are on
      npm, both first releases published by hand after `npm login` (the
      `~/.npmrc` registry token answered 401, so the `PUT` came back `E404` and
      `npm trust` `E401`), each trusting GitHub Actions `syntopica/codeality`
      `publish.yml` (test-quality `0ed2ad87-...`, ui-quality `1ad462a4-...`,
      publish and stage publish). Tags `test-quality@0.1.0`, `ui-quality@0.1.0`
      at 18a3438. The OIDC run for the never-published name failed as on
      2026-09-25 (run 37218754473, token exchange 404). Next releases:
      `gh workflow run publish.yml -f package=<name>`. `npm trust     --yes`
      still asks for 2FA in the browser; pasting it after other commands feeds
      the y/N prompt an empty line and cancels it.
- [x] Gate packages share one ESLint config: `gateCliEslintConfig` in gate-kit
      replaces the copies in db-quality, ui-quality and test-quality (609 rules
      on each `--print-config`, a hidden top-level const still errors), and
      their direct `@syntopica/eslint-config`/`eslint-plugin-regexp` devDeps go
      (knip). jscpd 0.94% to 0.76%.
- [x] test-quality candidate list measured: on 10xjoy 11 of the 70 DOM-word
      files passed under node anyway, 10 because of a bare `location` (an HTTP
      header) and one of `document` as a noun. `document`/`location` now count
      only as `document.`/`location.` globals and `Blob` is out (node has it):
      10xjoy 82 of 82 candidates pass under node (was 71 of 71), no failed
      candidate; verticagtm none left after its four files moved to node
      (verticagtm 327a0215).
- [x] New package `@syntopica/test-quality` (`codeality-test`), from the
      verticagtm test-cost diagnosis. `check` lists the suite through the
      project's own vitest (`assets/vitest-inventory.mjs`, nothing executed) and
      reads the git hooks: `duplicate-file-run`, `dom-environment-unused`,
      `uncached-hook-lint`, `hook-runs-full-gate`. `measure` runs the suite with
      the JSON reporter and samples RSS of vitest and its workers:
      `environment-dominates` (vitest 5 shares and vitest 4 seconds),
      `slowest-files`, `memory-use`, and with `--node-candidates` a rerun under
      `--environment node`. Generalises: 10xjoy (vitest 4, global jsdom) 71 of
      141 files are DOM-free and all 71 pass under node, environment 63-65% of
      the work vs tests 7%. verticagtm after its fix: no environment finding, 4
      files left that pass under node, 58 s wall, peak 3.3 GB. Running it on
      verticagtm caught a false positive in the tool itself (a
      `--cache-location .../eslint/` path read as an uncached eslint), fixed
      with that script as the fixture. gate-kit gained `readCliInvocation`,
      `cliTsupOptions`, `cliTestAliases`.

### 2026-10-01

- [x] ui-quality `text-hard-cut` false positive closed: a tie at the longest
      length now has to outnumber the texts within 10 characters below it
      (`pilesAtLongest`). InteliFactu's chart of accounts, once paged to 50,
      showed three whole PGC names of exactly 50 characters over twelve of 40-49
      and was reported as cut. Regression test in `textHardCut.test.ts`;
      InteliFactu full sweep afterwards: 1 finding, a real one.
- [x] ui-quality: `slow-request` times a slow GET a second time once the page
      settled (`retimeSlowRequests`, through the context's own session) and
      reports it only when it is still over `maxMs`; POSTs and server actions
      are never repeated. New `pagination-missing`: a main table rendering over
      300 body rows with no next-page control (fixture `long.html`). 112 tests.
      InteliFactu full sweep at load average 11-13: one `slow-request` left
      (`GET /api/purchases` 1635 ms, 1973 ms again), down from 12 machine-load
      findings, and two `pagination-missing` on Contabilidad (428 accounts).
- [x] ui-quality behaviour checks for what the user is told:
      `empty-state-missing` (a search for `zqxjv-0000` that empties the table
      with nothing in its place), `pagination-broken` (Next/Siguiente keeps the
      same rows, or Previous/Anterior does not bring page one back) and
      `action-silent` (the first form of the main region submitted while every
      non-GET request is answered 500 in the browser, so nothing is written; the
      screen must change). The action runs after the console and request
      recorders stop, since its failure is injected. The search is cleared in a
      `finally`, and its text read tolerates a table replaced by an empty state:
      without that, InteliFactu Compras remembered the probe search and the next
      route found no rows. Fixture `table.html#silent`; 103 tests; InteliFactu
      full sweep 0 behaviour findings.
- [x] `edge-misaligned` false positives on InteliFactu closed: full-bleed
      section bands and fixed drawers (82118ab) and contentless absolute
      ornaments such as a blurred circle overhanging a card (bfc77ee) no longer
      count as content edges. Verified by a full 45-route sweep of InteliFactu
      ending with 0 findings.
- [x] ui-quality reaches views held in client state: `routes[].localStorage` is
      written by an init script before the route loads (guarded by URL so it
      applies to that route alone). Found on InteliFactu, whose zustand store
      persists the current view; tested with a fixture that renders nothing
      without the stored view.

### 2026-09-30

- [x] Kysely support for `db-quality` is filed in `TODO.md` with its design spec
      (`docs/superpowers/specs/2026-09-30-db-quality-kysely-design.md`),
      including the cross-dialect rule `kysely.inline-references` for the MySQL
      8.4 case where an inline column `.references()` creates no foreign key.

### 2026-09-29

- [x] db-quality reads SQLite query files (unreleased): `sqlite.queries`
      (`paths`, optional `database`, `minRows` default 10000) adds `BDB404`
      (optional-parameter guard), `BDB405` (comma-list `instr()`) and `BDB406`
      (full table or index scan of a table above `minRows` in the plan of each
      statement, parameters unbound) to `check` and `gate`. Replayed on Vexa's
      dev store copy: the `jobs_list.sql` before f1052981 gives all three (a
      `SCAN jobs` of 800,535 rows plus a temp B-tree for ORDER BY), and the
      `mailbox_counts.sql` before 7bbbd697 gives `BDB406` (a full scan of the
      `message_placements` autoindex, 233,351 rows). The current 541 files give
      38 `BDB404` and 67 `BDB406` in 7.7 s. Gotcha: the sqlite3 shell draws
      `EXPLAIN QUERY PLAN` as a tree even under `-json`, so the plan is parsed
      from the tree. Not done: a per-file allowlist (the baseline covers
      intended scans) and `init` detection.

### 2026-09-26

- [x] `@syntopica/db-quality` 0.2.0 and 0.2.1 are on npm through `publish.yml`
      with provenance (runs 36201133295 and 36202178819). 0.2.0 adds strict
      mode, PostgREST rules BDB801-805, `perf snapshot`/`diff` (BDB901-904) and
      `perf bench` (BDB911-913) behind `perf.inGate`, and the adoption phases
      0-4. Validation on verticagtm and pxpn found six divergences, each fixed
      with a test (workflow upgrade, BDB901 5 ms floor, BDB913 1000-row floor,
      Storage and `Array.from` chains, and in 0.2.1 roots that git does not
      track). The final review found the bench could leave the read-only
      transaction (`; commit; set transaction read write`) and that EXPLAIN
      ANALYZE of CREATE TABLE AS writes even read-only; the bench now runs as a
      cursor in a subtransaction that is always rolled back, proven against a
      local Postgres. verticagtm is on 0.2.1 at phase 4 (`8a14a643`), baseline
      230, CI green on the static stage; its perf stage runs locally and in CI
      only once a `SUPABASE_DB_PASSWORD` secret exists. Follow-ups are in
      `TODO.md` under db-quality.

### 2026-09-25

- [x] `@syntopica/db-quality` 0.1.0 is on npm, published by hand from a clean
      build after `npm login` (the recorded registry token answered 401), and
      trusts GitHub Actions `syntopica/codeality` `publish.yml` (trust id
      `ba8c64de-...`, permissions publish and stage publish). Next releases go
      through `gh workflow run publish.yml -f package=db-quality`. Gotcha: a new
      package took about three minutes to answer `npm view` after the publish
      printed `+ @syntopica/db-quality@0.1.0`. First adopter: verticagtm
      `b9d6e90d`, strict configuration, baseline of 131, CI gate green on the
      static stage and 104 live findings left to migrations.

### 2026-09-24

- [x] `docs/standards/testing.md#suite-time-budget` gains "Vitest suites against
      a real database": nine techniques measured A/B (best of three under load)
      on a Next.js + MySQL monorepo, 819 s -> 139 s for the full check. Kept:
      dirty-table cleanup, a parallel DB-free project, tmpfs MySQL, a schema per
      worker, a node/DOM split, happy-dom. Rejected with numbers:
      `fsModuleCache`, `isolate: false`, `DELETE` over `TRUNCATE`, per-test
      rollback. Step 6 now points at per-worker copies as the way out of a
      shared resource, which the "never by worker groups" rule had left open.

### 2026-09-23

- [x] `syntopica-codeality-py` 0.2.3 is on PyPI (run 35791330170, trusted
      publishing). It adds `test-budget-seconds`: the gate reports a passing
      pytest stage as `over-budget` past it, with `--durations=10` on every run,
      and `init` scaffolds `pytest-xdist` with `-n auto`. The python-package
      template now carries `test-budget-seconds = 300` and locks 0.2.3; its gate
      passes against the published package. The first consumer budgeted is
      qlctool at 120 s, whose suite went from 19 minutes to 32 seconds on
      2026-09-22 - the measurement that became
      `docs/standards/testing.md#suite-time-budget`.

### 2026-09-18

- [x] Trusted publishing is configured for all six npm packages. The five
      `@syntopica/*` packages (`eslint-config`, `prettier-config`,
      `quality-config`, `tsconfig`, `create-baseline`) had none after their
      manual first publish on 2026-09-14; each now trusts GitHub Actions
      `syntopica/codeality` `publish.yml` (`npm trust github`, one passkey
      escalation per package), confirmed on every npmjs.com access page.
      `eslint-plugin-code-policy` already trusted it. The next release of each
      is the end-to-end proof. Gotcha: `npm trust` only prints its auth URL on a
      TTY; without one it prints `***` and exits EOTP.

### 2026-09-17

- [x] Renamed the Python baseline to `codeality-py`. `syntopica-codeality-py`
      0.2.0 is on PyPI (run 35163939573, trusted publishing from a pending
      publisher on the personal account: owner `syntopica`, repository
      `codeality`, workflow `publish-python.yml`, environment `pypi`). Import
      package `codeality_py`, console script `codeality-py`, config
      `codeality-py.toml`, accepted-findings record
      `.codeality-py-baseline.json`, suppression prefix
      `# codeality-py: ignore`. Rule codes keep `BPY`. Migrated and pushed
      across the eleven adopting repositories, brain, clips, atrium and
      syntopica among them; one more carries two untracked files, renamed on
      disk only. `baseline check` reports `0 new` in every repository that
      carries a baseline except atrium, whose 2 new findings predate the rename.
      `busirocket-baseline-py` 0.1.12 stays published and unyanked.

# TODO Log

Closed work from `TODO.md`, grouped by year and month.

<!-- tadu:log v1 since 2026-10-12 -->

## 2026

### 2026-10

- [x] 2026-10-22 — **JavaScript dependency security:** **Patch the newly indexed
      ip-address security finding.** Automatic CI 39832505747 at
      a9952345429c2535266d52da8f78a92a52bf1124 removes both Next.js findings but
      fails audit:check on moderate GHSA-rxp7-6hxx-x8q5 through the
      Lighthouse/Puppeteer proxy chain. Official advisory marks versions through
      10.7.3 affected and 10.7.4 patched. Qualify the smallest supported
      transitive lock update against parent ranges and the unchanged 1440-minute
      release-age policy, then verify the full installed graph and original
      audit/affected-consumer gates. Do not add an exception. Reference:
      https://github.com/advisories/GHSA-rxp7-6hxx-x8q5.
  - Result: Updated only the transitive lock selection from ip-address 10.7.3 to
    10.7.4, within the retained socks parent range. Preserved every importer,
    override, other artifact and snapshot edge; no new exception or release-age
    bypass.
  - Evidence: Official tarball SRI and mature publication metadata match. Exact
    full-document comparison admits only the package/snapshot replacement and
    sole socks edge. Full 19-workspace frozen candidate and actual installations
    match the qualified graph and native identities; original root check:ci:run
    passes all 58 tasks and 538 UI tests. Candidate and actual pnpm audit --json
    return five historical findings with the new ip-address and both Next
    advisories absent; pnpm run audit:check reports zero unwaived and zero
    expired findings. Actual original root lint, format and both dependency
    graphs pass. A pinned Node regression through socks passes three valid and
    four invalid IPv6 samples, including two bounded long malformed zones.

- [x] 2026-10-22 — **JavaScript dependency security:** **Patch the newly indexed
      Next.js security findings.** Automatic CI 39823659562 at
      d73307870e2ca81478027bb4af3eb72161a87c6b fails audit:check with critical
      GHSA-2464-fhr4-w9xw and high GHSA-p3m5-59mp-jv5r through
      templates/nextjs-app. Official advisories mark Next 16.0.0 through 16.4.0
      affected and 16.4.1 patched. The fresh report has seven advisories, two
      unwaived, zero expired and four existing exceptions; prior five-advisory
      acceptance is historical. Smallest next step: qualify the corrected Next
      family and full resolved graph against the unchanged 1440-minute
      release-age policy, then preserve, install and run the original template
      and audit gates. Do not add exceptions or bypass release age. References:
      https://github.com/advisories/GHSA-2464-fhr4-w9xw and
      https://github.com/advisories/GHSA-p3m5-59mp-jv5r.
  - Result: Raised four Next-family declaration floors to 16.4.1 and replaced
    the twelve matching lock artifacts. Eight upward shared snapshot bindings
    remain within their declared ranges and were covered by full CI. Preserved
    public peer ranges, Sharp 0.35.5, release-age policy, existing exceptions
    and local data.
  - Evidence: Next 16.4.1: pnpm audit --json retains five historical findings
    and removes GHSA-2464-fhr4-w9xw and GHSA-p3m5-59mp-jv5r; pnpm run
    audit:check passes with zero unwaived and zero expired findings. The
    original full root check:ci:run passes 58 tasks, including 538 UI tests, and
    the actual checkout passes the original Next build, lint:fast, type-check,
    lint, format:check, coverage tests, dupes, knip, check:quality, root
    lint/format and both dependency graphs. Full 19-workspace frozen
    installation matches the qualified graph and native identities.

- [x] 2026-10-22 — **ui-quality:** Detect interaction-driven height changes in
      semantic tab lists.
  - Result: Tab lists share the existing four-group/six-sample budget, measure
    their own bar, preserve the original selection beyond the sample, skip
    ambiguous states and retain earlier findings if another list disappears.
    Variable panel heights remain clean.
  - Evidence: Meaningful growing-bar and finding-retention regressions fail
    before their respective corrections. Nine focused cases pass; original UI
    lint, type-check, build and test --maxWorkers=2 pass, with 538 tests across
    133 files and 97.02% statements/92.31% branches/95.76% functions/98.32%
    lines. Scoped Prettier and both root dependency graphs pass. Verification
    commands: from packages/ui-quality, pnpm run lint, pnpm run type-check, pnpm
    run build and pnpm run test --maxWorkers=2; from the root, pnpm run
    deps:graph and pnpm run deps:graph:aliased. Full guarded acceptance exits
    zero with source, lock, installed state and tools parity.

- [x] 2026-10-22 — **JavaScript dependency security:** Qualify JS and MJS
      unused-variable controls through all eight actual template configurations.
  - Result: All 16 controls select the shared wrapper with backend/parser 8.71.2
    and Espree 11.2.0. Older direct peer contexts remain installed; no further
    declaration or lock change is necessary for these controls, and no global
    family migration is claimed.
  - Evidence: The actual-template runner passes 16 unique template/extension
    controls. Command: python3 -B verify_saved_proof.py; saved-proof
    verification exits zero with current source, lock, native tools and
    installed metadata/links/state parity. The original supervisor exits one
    because Nuxt regenerated eslint-typegen.d.ts; that generated-output
    provenance remains unqualified and is not claimed unchanged.

- [x] 2026-10-22 — **Estate:** Bound package-task concurrency and test workers
      in the CI fallback.
  - Result: Package tasks execute serially with two Vitest workers; existing
    host admission and all original checks remain enabled.
  - Evidence: Automatic CI 39818227865 passes all seven jobs at
    01bb08a437665600e11b5cdbf5a91c39c9ca67b1; verified with gh run view
    39818227865 --repo syntopica/codeality --json
    status,conclusion,headSha,jobs. Installed Turbo dry runs preserve all 72
    planned task nodes, and Vitest resolveConfig reports maxWorkers=2.

- [-] 2026-10-22 — **Python baseline:** Route cross-project debt to its owning
  backlogs.
  - Resolution: Routed to the existing owning DJCenterDeluxe and djplayerdeluxe
    quality-baseline TODO entries. Live owning-backlog inspection confirms the
    same accepted four fixture-SQL cases and the 39 structural findings / 28
    mypy ignore sections remain tracked there. Codeality has no implementation
    obligation for that duplicate bookmark; no hardware-dependent issue was
    fixed, remeasured or dropped.

- [x] 2026-10-22 — **Dependency graph:** Correct all 127 false
      runtime-development dependency diagnostics.
  - Result: Classify the complete emitted dependency types so erased type
    imports and declared peers are distinguished from dev-only runtime
    dependencies. Keep warning severity and every other rule unchanged. Six
    real-detector controls preserve both genuine runtime warnings, including an
    import resolving to a declaration file. No dependency, lock, path waiver or
    suppression changed.
  - Evidence: The focused integration test failed with the original rule (five
    warnings instead of two), then passed after the classification fix. In
    packages/quality-config, pnpm run lint, pnpm run type-check and pnpm run
    test --maxWorkers=2 pass: 107 tests across 21 files. Original root pnpm run
    deps:graph passes with zero violations across 3,698 modules and 5,401
    dependencies; pnpm run deps:graph:aliased passes across all six workspaces
    with no orphans. Full source, installed metadata/links/state, native
    artifacts and pinned tools retain parity.

- [x] 2026-10-22 — **JavaScript dependency security:** Remove the critical Nuxt
      dependency chain and accidental unit-test route.
  - Result: Adopted Nuxt 4.6.2 with the combined frozen graph; simple-git and
    its argv-parser are absent. Moved the unit test out of server/api so Nitro
    cannot register it as an API route. The isolated development smoke restores
    SSR, API and Devtools responses and returns 404 for the accidental test
    route; production preview also passes. No interactive browser or package
    publication is claimed.
  - Evidence: All nine original Nuxt scripts pass within the combined 44-stage
    verification. From templates/nuxt-app, actual pnpm run type-check, lint,
    test --maxWorkers=2 and format:check exit 0; three tests pass with 100%
    coverage against unchanged 80% thresholds. Root pnpm run lint:root,
    format:check and audit:check pass. The complete five-advisory audit has no
    critical, expired or unwaived finding; existing exceptions and
    minimumReleaseAge 1440 are unchanged. All tracked source, full19 installed
    metadata/links/state, native artifacts and pinned tools retain parity.

- [x] 2026-10-22 — **JavaScript tooling:** Adopt the released typescript-eslint
      8.71.2 shared-wrapper fix and remove obsolete overrides.
  - Result: Raised thirteen floors, added the shared runtime plugin and removed
    only the two obsolete overrides. Adopted the combined graph with Nuxt 4.6.2
    and existing tsup 9. Eight legacy template-wrapper peer contexts and seven
    broader old-family snapshots remain separately tracked; no global family
    migration is claimed.
  - Evidence: Pinned pnpm 12.9.1 frozen install selected all 19 workspaces and
    matched the complete qualified graph and native artifacts. All 44 original
    combined stages pass (937 tests, three existing PostgreSQL skips); eight
    actual-checkout stages pass. Actual JS/MJS wrapper controls report exactly
    two intended unused-variable errors each through Espree 11.2.0 and
    plugin/parser 8.71.2. Original pnpm run audit:check exits 0: five
    advisories, four existing active exceptions and one below threshold; no new
    or extended waiver.

- [x] 2026-10-22 — **JavaScript dependency security:** Validate complete audit
      reports and explicit own exceptions; preserve compiler alias origins.
  - Result: Validate subprocess results and complete consistent audit reports
    before applying the unchanged dated advisory policy. Reject inherited
    exception properties while preserving explicit own entries and numeric
    fallback. No threshold, waiver or expiry changed. Compiler-owned alias
    origins, workspace discovery, temporary-file ownership and the typed
    standalone cruise helper are also verified; package publication remains
    separate.
  - Evidence: Original quality-config lint and native type checks passed; pnpm
    run test --maxWorkers=2 passed all 106 tests across 20 files. Exact packed
    tarball passed license, strict publint and type analysis, strict external
    consumer and shipped runtime checks. Packaged synthetic audit cases returned
    error=2, inherited-exception=1 and valid-empty=0. Actual pnpm run deps:graph
    and pnpm run deps:graph:aliased both exited 0; the former retained 127
    dev-dependency warnings, and the latter found no orphans across six
    workspaces. Source, dependency identities and temporary-file cleanup were
    verified.

- [x] 2026-10-22 — **JavaScript dependency security:** Replace vulnerable
      esbuild through tsup 9.0.0 in the four package builders.
  - Result: Raised the four builder floors and adopted the verified lock and
    workspace installation, preserving previous source and generated outputs
    recoverably. Failed offline attempts remain documented; a separate frozen
    online install completed without changing policy, integrity or scripts. No
    package release or deployment; Nuxt critical findings remain a separate
    task.
  - Evidence: Pinned pnpm 12.9.1 frozen installation selected all 19 workspaces
    and matched the qualified 1,823-node graph, including only active esbuild
    0.28.2 and three exact native artifacts. Original
    `pnpm --filter ./packages/ui-quality run build`,
    `pnpm --filter ./packages/test-quality run build`,
    `pnpm --filter ./packages/db-quality run build` and
    `pnpm --filter ./packages/eslint-plugin-code-policy run build` commands each
    exited 0 on the actual checkout. Source, installed metadata, manager state
    and the existing fixture remained unchanged during builds. Isolated affected
    gates passed 1,357 tests with three existing database skips; final UI gates
    passed 531 tests and package/runtime/watch checks passed. The unchanged
    `baseline-audit --level moderate` policy passed with nine raw advisories,
    eight existing active exceptions and one below threshold.

- [x] 2026-10-22 — **Python baseline:** Adopt the fixed certifi bundle in both
      local Python quality environments.
  - Result: Replace only the managed certifi distributions with the verified
    official 2026.10.19 wheel, offline and without dependencies or builds.
    Preserve both editable roots and recoverable exact old-file backups.
  - Evidence: Targeted uv pip install --offline --no-index --no-deps --no-build
    --reinstall-package certifi completed in both exact prefixes. Both managed
    RECORD checks, no-network SSL context loading (120 CA certificates) and uv
    pip check passed. The other 44/47 distribution metadata and direct_url
    identities, all tracked source hashes/modes and runtime prefixes stayed
    identical. Shared 300/120 supervisor exited 0 in 4.07 seconds with no guard
    trigger or owned process survivors.

- [x] 2026-10-22 — **Python baseline:** Update both Python locks to the fixed
      certifi trust bundle.
  - Result: Update only certifi from 2026.7.22 to 2026.10.19 in the package and
    template locks; preserve all other 44/47 registry records and original
    quality policy. Existing local quality environments remain a separate
    adoption task.
  - Evidence: Both original isolated codeality-py gate --project commands exited
    0 (seven required stages each), retaining coverage minimum 80 and original
    pytest budgets 60/300 seconds. Explicit pip-audit --no-deps --disable-pip
    --format json audits of 7 backend, 45 package and 48 template pins returned
    zero vulnerabilities and zero skips. Frozen wheel-only sync, offline
    hash-required editable installs, uv pip check, managed RECORD and
    source/lock parity all passed. Exact final lock hashes:
    2834b292397b2ed1d0f412ed4312cff1b96e361a118c9deae96ca70dbba17ccc and
    126a0ec3ced9857b0932364152aea4563bca0ad7a5cdd60bb5b7584d0f3b2fcc.

- [x] 2026-10-22 — **ui-quality:** Support explicit numeric primary sort keys.
  - Result: Read declarations and legacy text atomically; accept one rendered
    finite decimal declaration and preserve existing parsing for every rejected
    or absent declaration. Count ties keep their meaning without choosing a
    first line heuristically. Consumer adoption stays a separate partial task.
  - Evidence: Original `pnpm run build` and `pnpm run test` passed 531 tests in
    130 files on the combined sticky and numeric candidate. Coverage was 97.01%
    statements, 92.35% branches, 95.70% functions and 98.30% lines against
    unchanged thresholds. Full native TypeScript and ESLint passed after
    correcting a fixture parameter-count violation; the failed first static run
    is retained. Pure and real DOM zero-area controls pass. Final actual bytes,
    modes and deletion match the 26-path frozen manifest; README permission
    normalization changed no tested bytes. No consumer adoption, release or
    deployment occurred.

- [x] 2026-10-22 — **ui-quality:** Implement conservative sticky-header tap
      occlusion with imported browser helpers.
  - Result: Subtract confirmed header coverage into exposed target fragments,
    preserving overlap tolerance, finding identity and legacy fallback. Reject
    uncertain paint, including mask-border and WebKit mask-box sources. The
    historical consumer report stays partial pending a current screen capture.
  - Evidence: Isolated `pnpm run build` and original `pnpm run test` passed 516
    tests in 128 files; coverage was 96.87% statements, 92.09% branches, 95.45%
    functions and 98.14% lines against unchanged thresholds. Full UI ESLint,
    native TypeScript, explicit browser-helper ESLint and 24-path Prettier
    checks exited 0. Scoped canonical Knip found no new issues against the same
    unbuilt baseline. Independent review's mask finding was corrected; final
    actual bytes and modes match all 24 tested source paths. No release,
    consumer deployment or full-workspace green claim is implied.

- [x] 2026-10-22 — **ui-quality:** Exclude the generated browser bundle from
      root formatting.
  - Result: Add the exact generated asset directory to the root ignore file;
    authoring assets and helpers retain formatting checks. CI run 39770037681
    passed all 58 Turbo tasks and root ESLint, then exposed the missing ignore
    at the formatting step.
  - Evidence: Prettier 3.9.10 file-info assertions classify the generated bundle
    as ignored and authoring sources as included; root `prettier --check .`
    passes. The independent Python pip-audit failure remains in TODO.md.

- [x] 2026-10-22 — **ui-quality:** Build a composable browser probe distribution
      foundation.
  - Result: Bundle the unchanged legacy probe body as a self-contained browser
    IIFE and load its synchronous default through a lexical wrapper. Build/test
    scripts generate the asset, package files ship it explicitly, Knip covers
    authoring entries and Turbo restores generated assets with CLI output. No
    dependency, sticky behavior, package version or publication changed.
  - Evidence: In the isolated candidate, pinned `pnpm run test` from a missing
    generated asset passed 491 tests in 122 files with unchanged coverage
    thresholds: 96.84% statements, 92.01% branches, 95.44% functions and 98.12%
    lines. Full UI ESLint with `--max-warnings 0`, native TypeScript `--noEmit`,
    `pnpm run build`, offline pack, canonical Knip comparison and DOM parity
    passed. The packaged public CLI read the actual shipped asset and captured
    one synthetic local screen; exit 1 retained three real touch-target
    findings. Single-package Turbo cache miss/hit/invalidation/restoration
    passed with byte/mode parity. Independent review found no actionable issue.
    All ten actual source paths match the tested candidate bytes/modes; npm
    release, consumer deployment and whole-workspace audit acceptance remain
    unperformed.

- [x] 2026-10-22 — **ui-quality:** **A count over a list of years reads as one
      grouped number.** A cell showing "1" over "2026" (two block lines) has
      innerText "1\n2026", which `AMOUNT_TEXT` takes as 12026, so a correct
      "Años" column was flagged `sort-broken`. Worked around in the consumer ("1
      año"); the probe could read block lines separately.
  - Result: Detect separate numeric lines before amount parsing so count/year
    cells retain normalized textual keys instead of concatenating digits. Single
    amounts with wrapped units, grouped horizontal whitespace and USD prefixes
    retain numeric behavior. The separate tied-count primary-sort task remains
    pending; no npm release or application deployment occurred.
  - Evidence: From packages/ui-quality: ./node_modules/.bin/vitest run
    --coverage --maxWorkers=2 passed 489 tests across 121 files. Original
    coverage thresholds passed: statements 96.84%, branches 92.01%, functions
    95.44%, lines 98.12%. ./node_modules/.bin/eslint src tests bin
    --max-warnings 0, node node_modules/@typescript/native/bin/tsc --noEmit -p
    tsconfig.json and ./node_modules/.bin/tsup all passed. Ten focused behavior
    cases and independent review passed. Final parity covers 1050 source
    files/modes, 2264 installed identities, 66 resolver links and four
    lock/manager files; numberOf is unchanged from HEAD.

- [x] 2026-10-22 — **Conformance:** Diagnose coverage for named CI test scripts.
  - Result: Discover directly qualified Vitest/Jest scripts reached from CI and
    target coverage fixes at their actual names. Keep missing coverage and
    missing thresholds fatal, reject ambiguous config ownership and disabled
    coverage, and preserve the conventional test contract. Vexa metadata now
    reports coverage-run for test:unit and coverage-thresholds instead of
    claiming that no test suite exists. No consumer coverage settings changed.
  - Evidence: From packages/create-baseline, heavy-suite
    ./node_modules/.bin/vitest run --coverage --maxWorkers=2 passed 226 tests in
    23 files with the original 80 percent thresholds; scoped ESLint passed.
    Coordinator independently reran coverage/gate regressions and verified all
    seven accepted file hashes. Current Vexa metadata retains both fatal
    findings.

- [x] 2026-10-22 — **Estate:** **Wait for registry availability in the npm
      publish workflow** (2026-10-21). Run 39529271695 succeeded before
      quality-config 0.15.0 was visible in npm metadata or installable; it
      became available a few minutes later. Smallest next step: add pnpm's
      supported `--publish-wait-timeout 600000` to the workflow publish command,
      so success also verifies metadata and tarball availability.
  - Result: The manual publish command now waits up to 600000 milliseconds for
    exact-version registry metadata and tarball availability. It preserves OIDC,
    ignore-scripts and the sole workflow_dispatch trigger; a comment warns that
    a timeout may follow an accepted upload.
  - Evidence: actionlint .github/workflows/publish.yml and pnpm exec prettier
    --check .github/workflows/publish.yml exit 0. Structural comparison proves
    triggers/permissions unchanged and the exact wait flag occurs once. Official
    pinned pnpm 12.9.1 implementation supports the flag. No publication,
    workflow dispatch or retry was executed.

- [x] 2026-10-22 — **ui-quality:** **`label-wrap`: align wrapped-label icons
      with the first text line** (2026-10-12). `textBoxOf` follows a
      single-child chain and misses sibling SVG/text labels, while the probe
      lacks the first text line's vertical centre. Smallest next step: measure
      that centre from own-text Range rectangles, identify an unambiguous
      SVG/text branch locally to the label rule, and compare against a
      real-browser first-line-aligned control. Keep missing legacy metadata
      conservative, ambiguous compositions unclassified, and SVG viewport
      geometry distinct from optical painted alignment. Calibrate a tolerance
      from fixtures before changing detection.
  - Result: Detect SVG viewport misalignment against the first text line of
    short wrapped labels, with conservative geometry, size and composition
    guards. Consumer UI and optical artwork alignment remain separate acceptance
    boundaries.
  - Evidence: Isolated node node_modules/vitest/vitest.mjs run --coverage
    --maxWorkers=1 passed 121 files and 482 tests; 24 focused tests, package
    ESLint, type-check and build passed. Installed root Knip normal and
    production --treat-config-hints-as-errors both exited 0; all 739 source
    hashes remained unchanged. Independent review returned no findings.

- [x] 2026-10-22 — **UI rules:** Detect actively clamped crowded metadata.
  - Result: Capture the computed line clamp and combine horizontal and vertical
    visible-text estimates for active clipping. Preserve roomy, multi-line and
    missing-metadata controls. Icon alignment and the private Modelos label with
    more than twelve visible characters remain open.
  - Evidence: Package lint, type-check and build passed, as did normal and
    production Knip with --treat-config-hints-as-errors. The independently
    source-matched isolated command node node_modules/vitest/vitest.mjs run
    --coverage --maxWorkers=1 passed 118 files and 458 tests with original
    coverage thresholds: 98.1% lines, 95.4% functions and 91.82% branches.
    Earlier execution passed 452 tests with six CLI timeouts; those six timed
    out in both the directed retry and the published base control. Assertions,
    timeouts and coverage thresholds were unchanged. Independent review found no
    issues.

- [x] 2026-10-22 — **Compact table headers:** Allow a compact header above
      consistently sized data rows.
  - Result: Header rows shorter than the body median no longer produce
    row-height-scale findings. The existing header-more-than-eight-pixels-taller
    check and two-pixel body-row spread check remain unchanged. Generic table
    fixtures and documentation capture the policy without a
    calendar/library/class exemption; original private-screen acceptance is not
    claimed.
  - Evidence: The 19px-header/36px-body regression failed before the fix.
    `pnpm --filter @syntopica/ui-quality exec vitest run tests/rules/tables.test.ts tests/cli.data-display.integration.test.ts --maxWorkers=1`
    passed 36 tests in two files, including the existing 64px/40px tall-header,
    uneven body, wrapped-row and tolerance controls. Package lint, type-check
    and build passed; independent review returned no findings.

- [x] 2026-10-22 — **Sticky-pager diagnostic fixture:** Preserve real visibility
      and horizontal-inset findings while investigating the sweep observation.
  - Result: Added a synthetic Chromium fixture with five measured scroll/layout
    states. A covered intermediate row becomes exposed on further scrolling; a
    layout reserving pager space exposes the final row, while an overlapping
    pager permanently covers it at maximum scroll. Sixteen-pixel horizontal
    insets stay clean and genuine two-pixel insets remain cramped. No production
    rule or exemption changed; the original private-screen observation remains
    pending.
  - Evidence:
    `pnpm --filter @syntopica/ui-quality exec vitest run tests/capture/stickyPager.integration.test.ts --maxWorkers=1`
    passes the actual probe and both rules across all five captures. Targeted
    ESLint, package type-check, Prettier and diff checks pass. The prior scratch
    diagnostic independently measured twelve states; no private data or external
    page was used.

- [x] 2026-10-22 — **Scrolling list boundaries:** Stop inferring the logical
      list end across a genuinely scrolling ancestor.
  - Result: The frame traversal stops at vertical auto/scroll ancestors whose
    content exceeds the client height by more than the existing two-pixel slack.
    Ordinary frames, nonoverflowing auto containers and distinct inner cards
    retain their behavior. Immediate-list handling is unchanged; original
    private-screen acceptance is not claimed.
  - Evidence: Two virtual-spacer regressions failed before the fix and seven
    controls passed.
    `pnpm --filter @syntopica/ui-quality exec vitest run tests/rules/listDanglingRule.scrolling.test.ts tests/cli.data-display.integration.test.ts --maxWorkers=1`
    passed 36 tests in two files. Package lint, type-check and build passed;
    independent review returned no findings. CodeGraph sync, formatting, doctor
    and diff checks passed.

- [x] 2026-10-22 — **Column wrapping evidence:** Distinguish a container edge
      from its independently constrained text child.
  - Result: Wrapped text must share the candidate block's content-right boundary
    within the existing two-pixel tolerance. Border, shadow and fill evidence is
    unchanged. Near-miss fixtures cover one-line self-start headings and
    overflowing single-line text; the interaction-sweep parent retains its other
    findings.
  - Evidence: The constrained-child regression failed before the fix.
    `pnpm --filter @syntopica/ui-quality exec vitest run tests/rules/raggedColumn.test.ts tests/rules/raggedColumn.wrapping.test.ts tests/cli.ragged.integration.test.ts --maxWorkers=1`
    passed 17 tests in three files, including the existing CLI capture.
    Independent review returned no findings. Probe source confirms line counts
    measure direct text nodes only, so ancestors do not inherit child line
    counts. Package lint, type-check and build also passed. Original private
    screens were not recaptured.

- [x] 2026-10-22 — **UI repair validation:** Verify the combined navigation,
      paint, spacing and rule-precision repairs on the frozen source tree.
  - Result: The package gate covers the repaired client-document redirects,
    unfinished resources, references, dates, hidden measurement text,
    transparent PDF glyphs, intrinsic controls and two-pixel spacing. Existing
    standalone ESLint compatibility and noninteractive column cases remain in
    the active backlog.
  - Evidence: `pnpm --filter @syntopica/ui-quality lint`,
    `pnpm --filter @syntopica/ui-quality type-check`,
    `pnpm --filter @syntopica/ui-quality build` and
    `pnpm --filter @syntopica/ui-quality test --maxWorkers=1` all exited 0; 113
    files and 430 tests passed with coverage. Root
    `pnpm knip --treat-config-hints-as-errors` and its `--production` variant
    passed; the two existing production binary warnings remain. Quality-config's
    full suite passed 36 tests in ten files, with package lint/typecheck and
    formatting. This is source validation, not npm publication or consumer
    deployment.

- [x] 2026-10-21 — **PDF selection-layer repairs:** Exclude unpainted
      transparent glyphs from visible-copy and typography rules.
  - Result: A shared paint classifier protects undersized-text, ascii-ellipsis,
    bare-url and type-scale-sprawl without removing probe geometry or exempting
    a CSS class. Opaque, clipped-background, shadow-painted and unknown-color
    controls retain conservative checks.
  - Evidence: The undersized-text regression and three remaining rule
    regressions failed before their fixes.
    `pnpm --filter @syntopica/ui-quality exec vitest run tests/rules/pdfSelectionText.test.ts tests/rules/undersizedText.paint.test.ts tests/rules/typography.test.ts tests/rules/typeScaleSprawl.test.ts tests/rules/copy.test.ts tests/rules/newRules.test.ts --maxWorkers=1`
    passed 37 tests in six files. Independent review returned no findings.
    Official PDF.js text_layer_builder.css declares selection spans transparent;
    no production PDF or consumer deployment was tested.

- [x] 2026-10-21 — **Column-width precision:** Preserve intrinsic button and tab
      widths beside full-width content.
  - Result: Native buttons and semantic button/tab controls share the existing
    content-sized table exception. They remain in adjacency and row
    calculations; noninteractive self-start sections remain a pending sweep
    case.
  - Evidence: Three control regressions failed before the fix;
    `pnpm --filter @syntopica/ui-quality exec vitest run tests/rules/raggedColumn.test.ts --maxWorkers=1`
    passed all nine tests, including capped heading, note and prose positives.
    Targeted ESLint and independent review passed.

- [x] 2026-10-21 — **Spacing precision:** Accept two-pixel token half steps
      while retaining irregular-spacing detection.
  - Result: The default spacing quantum is 2px. Existing exclusions and noise
    thresholds remain unchanged; deliberately broken fixtures now use 5/9/13px
    instead of legitimate 6/10/14px values. No token-configuration API was
    added.
  - Evidence: The mixed 6/10/14px screen regression failed before the fix.
    Focused spacing and CLI tests passed 12 cases; the split unit fixtures
    passed 11 cases and whole-package typecheck passed. The final combined
    package gate is recorded in the 2026-10-22 validation entry.

- [x] 2026-10-21 — **Verified interaction-sweep repairs:** **Keep dates, times
      and reference columns outside quantity alignment requirements.** The sweep
      applied quantity formatting to fiscal dates and identifiers.
  - Result: The quantity-alignment check excludes recognized dates and clock
    times before its existing numeric-share calculation. Existing alphanumeric
    reference behavior and amount checks remain unchanged.
  - Evidence: Four date/time regressions failed before the fix; pnpm --filter
    @syntopica/ui-quality exec vitest run tests/rules/numericAlignment.test.ts
    --maxWorkers=1 passes all 8 cases, including the previously accepted
    reference control and genuine amount faults. Targeted ESLint passes.
    Independent review returned no findings.

- [x] 2026-10-21 — **Verified interaction-sweep repairs:** **Exclude the
      offscreen Recharts text measurement helper from painted-text inspection.**
      The sweep flagged the helper's small font as readable UI text.
  - Result: The probe skips only the exact private measurement ID while its box
    is entirely above the viewport; visible content with the same ID remains
    inspected.
  - Evidence: A real Chromium regression failed before the fix, then both
    offscreen and visible control cases passed: pnpm --filter
    @syntopica/ui-quality exec vitest run
    tests/capture/probe.measurement.integration.test.ts --maxWorkers=1. Upstream
    DOMUtils.ts confirms top -20000px placement
    (https://raw.githubusercontent.com/recharts/recharts/main/src/util/DOMUtils.ts).
    Independent review returned no findings.

- [x] 2026-10-21 — **Verified UI rule repairs:** **Require sufficient prose
      evidence for text-hard-cut.** The fiscal sweep reported two natural
      67-character captions and four fixed-width 35-character codes.
  - Result: Require at least three eligible texts, remove the two-text majority
    exception, and exclude texts without internal whitespace. Positive fixtures
    represent actual prose and three eligible cuts.
  - Evidence: Both near-miss regressions failed before the fix; all 13
    textHardCut tests pass afterward. Independent review returned no findings.
    Other interaction-sweep findings remain pending.

- [x] 2026-10-21 — **Verified UI rule repairs:** **Preserve alphanumeric invoice
      references in raw-placeholder.** The fiscal sweep misclassified a supplier
      invoice reference as snake_case.
  - Result: Only letter-only snake_case words qualify as implementation labels;
    camelCase and key-and-ID detection remain unchanged.
  - Evidence: Three alphanumeric reference regressions failed before the fix;
    all 18 newRules tests passed afterward, including four genuine identifier
    controls. Independent review returned no findings.

- [x] 2026-10-21 — **ui-quality:** **Navigation waits for `load`, so one stuck
      image hangs a capture.** `gotoSettled` and `login` (`waitForURL` default)
      wait for the `load` event before the bounded `networkidle` settle.
      TienesLaVibra `/admin/leads` (2026-10-15) keeps per-lead
      `/api/admin/avatar?phone=...` image requests open past commit locally, and
      a propose run against production never reached a screenshot. Smallest
      step: reproduce with a fixture page whose image never finishes, then
      navigate on `domcontentloaded` and bound the wait for `load` like
      `networkidle`.
  - Result: Route navigation and login wait for DOMContentLoaded, then bound
    load and network-idle settlement concurrently. Document navigation failures
    still reject. Pending main-document redirects must reach DOM readiness
    within the settle cap; latest failed redirects reject, while newer
    successful navigation and same-document history redirects remain valid.
  - Evidence: The real Chromium unfinished-image route fixture timed out before
    the fix. Targeted navigation, existing CLI login and raw-placeholder tests
    pass all 22 cases; the fixture covers route navigation, form login with an
    unfinished image and failed document navigation. Independent review returned
    no findings. The first complete frozen run exposed a client-auth redirect
    race (415/416 tests passed). Two additional deterministic pending/aborted
    redirect regressions failed before their corrections; all eight Chromium
    navigation cases, ESLint and package typecheck then passed.

- [x] 2026-10-21 — **Verified timestamp classification repair:** **Prevent
      eight-digit reference codes from being classified as relative times.** The
      fiscal interaction sweep recorded compact NIF-shaped values with H, W and
      M suffixes as timestamps.
  - Result: Timestamp classification now excludes compact eight-digit references
    with a letter suffix; spaced or explicitly named durations remain eligible.
    The interaction-sweep parent remains partial with its other findings
    pending.
  - Evidence: Four synthetic reference regressions failed before the fix. pnpm
    --filter @syntopica/ui-quality exec vitest run tests/rules --maxWorkers=1
    passed 39 files and 196 tests; fields plus CLI copy integration passed 18
    tests. Package lint and type-check passed. Independent review returned no
    findings. No consumer deployment or package release.

- [x] 2026-10-21 — **quality-config bins assume pnpm:** `baseline-dupes` and
      `baseline-type-coverage` spawn `pnpm exec` (`pnpmCommand()`), so in a bun
      project (teleporte-web, 2026-10-19) the first run made pnpm 12 install
      itself: an untracked `pnpm-lock.yaml`, `pnpm-workspace.yaml` and a second
      `node_modules/.pnpm` tree whose duplicate vite broke `tsc -b` on
      `vite.config.ts`. A CI runner without pnpm would fail the gate outright.
  - Workaround in teleporte-web:
    `jscpd . --config node_modules/@syntopica/quality-config/jscpd.json` and
    `type-coverage --strict --at-least 99` called directly.
  - Next step: resolve the binary from the consumer's `node_modules/.bin` (or
    detect the package manager from the lockfile) instead of always going
    through pnpm.
  - Result: baseline-dupes and baseline-type-coverage resolve the
    consumer-installed Node CLI directly, including hoisted workspace
    dependencies; arguments and failure behavior are preserved without invoking
    a package manager.
  - Evidence: Four CLI regressions failed before the change; pnpm --filter
    @syntopica/quality-config test --maxWorkers=1 passed 9 files and 32 tests;
    lint and type-check passed. Real jscpd scanned a temporary source fixture
    and type-coverage measured 5/5 identifiers with empty PATH and no manager;
    no pnpm lock/workspace files were created. Independent review found no
    issues. Source correction only, not an npm publication.

- [x] 2026-10-21 — **ui-quality:** **`check --routes` given twice silently keeps
      only the last glob** (2026-10-15, verticagtm).
      `--routes /today --routes /plans/<id> ...` drove only the last route,
      while `.codeality-ui/screens/` still held older captures of the others, so
      a review sent stale screenshots as current. Next step: accept a repeated
      `--routes` (union of globs) or exit 2 on a repeat, with a test.
  - Result: Repeated route options now fail before reading configuration,
    launching a browser or writing artifacts; separate and equals spellings are
    covered.
  - Evidence: pnpm --filter @syntopica/ui-quality test --maxWorkers=1 passed 108
    files and 387 tests; package type-check, lint, build and targeted formatting
    passed; fresh compiled CLI returned exit 2 and preserved existing report and
    screenshot bytes.

- [x] 2026-10-21 — **Estate:** **Make the estate coverage cell reflect fatal
      coverage findings.** Reproduced 2026-10-21: calling `formatEstate` with
      one synthetic row and `{ id: 'coverage', level: 'error' }` prints `cov ok`
      while its footer says zero fully wired. The column checks only
      `coverage-run` and `coverage-thresholds`; `checkCoverageThresholds` also
      returns `coverage` for missing or unreadable test wiring. Smallest next
      step: include every fatal coverage finding in the cell predicate and add a
      synthetic formatter regression covering an absent test script, without
      making informational workspace-delegation findings fail. No application
      coverage result is implied by a green cell until corrected.
  - Result: Fatal coverage findings now render FAIL in the estate coverage
    column; informational workspace delegation remains nonfailing. Independent
    read-only review returned no findings.
  - Evidence: Regression failed before the fix (1 failed, 10 passed), then pnpm
    --filter @syntopica/create-baseline exec vitest run tests/estate.test.mjs
    --maxWorkers=1 passed 11/11; pnpm --filter @syntopica/create-baseline test
    --maxWorkers=1 passed 200/200 tests with coverage; package lint and targeted
    Prettier checks passed.

- [x] 2026-10-21 — **Release:** Publish quality-config 0.15.0
  - Result: Released the custom-layout Knip fix and the existing Dart/Swift
    duplication configuration feature through GitHub OIDC. Updated the generated
    baseline pin; other package versions are unchanged.
  - Evidence: Full pnpm check:ci passed 58 tasks before the version-only commit;
    package tests (28), create-baseline tests (198), lint, type-check,
    publish:check and frozen install passed. Annotated quality-config@0.15.0
    points to 3f00a217; workflow 39529271695 succeeded. The public npm tarball
    has 38 files, matching source bytes and no private artifact paths.

## 2026-09

## 2026-08

### 2026-08-31 - busirocket-baseline-py 0.1.0 published to PyPI

The Python baseline shipped. The publishing organization had no PyPI account, so
one was created, its email verified, recovery codes generated and 2FA enabled
with TOTP. The credentials, the TOTP seed and the remaining recovery codes live
in the password manager, not here.

The trusted-publisher entry is registered as a pending publisher: owner
`BusiRocket`, repository `baseline`, workflow `publish-python.yml`, environment
`pypi` (the GitHub environment had to be created first; it did not exist).

Evidence: run 33443267597 green end to end,
`uv run --isolated --with busirocket-baseline-py baseline-py --version` reports
0.1.0 from a clean environment, and `templates/python-package` now locks, syncs
and passes `baseline-py gate` against the published package. Its `uv.lock` is
committed.

- [x] 2026-08-31 - **The five bumped-but-unpublished packages are released, and
      the estate's lockfile blocker is gone.** `eslint-plugin-code-policy`
      0.7.4, `tsconfig` 0.3.0, `quality-config` 0.11.0, `eslint-config` 0.8.0
      and `create-baseline` 0.9.0 are tagged, pushed and on npm;
      `pnpm release:check` reports "6 packages fully released". No `npm login`
      at any point: publishing is
      `gh workflow run publish.yml -f package=<name>`, tokenless over OIDC, and
      `npm whoami` returning 401 on this machine is the normal state rather than
      a blocker. That premise had been recorded backwards in `TODO.md`, which is
      why the release sat blocked; it is now corrected there, in the project
      memory and in a new `CLAUDE.md`. Each package was dispatched once but
      GitHub recorded two `workflow_dispatch` runs per package (ten runs, five
      successes and five failures). The duplicate always lost the race and
      failed with
      `E403 ... cannot publish over the previously published versions`, which is
      npm refusing to overwrite an immutable version - harmless, but the
      doubling itself is unexplained and worth watching on the next release.
      Evidence: `curl registry.npmjs.org/<pkg>` shows every version live with a
      2026-08-31 timestamp, and `pnpm release:check` exits 0.

- [x] 2026-08-31 - **Every workspace dependency taken to its latest release,
      majors included.** Two passes over the root, the seven packages and the
      eight templates: patch/minor first (`9e73a4b`), then the majors it left
      behind (`4c20c50`) - eslint-plugin-regexp 2 to 3, eslint-plugin-unicorn
      57/72 to 74, globals to 17.11, NestJS 11 to 12,
      eslint-plugin-react-refresh to 0.5.5. None needed a config change. Two
      things worth keeping: `ncu` strips the integrity hash from
      `packageManager`, so `corepack use pnpm@<version>` has to follow every
      run; and `h3` cannot go to 2.x while the template is on Nuxt 4.5, which
      ships Nitro 2 and requires `h3@^1.15.11` - with `h3@2` present,
      `@nuxt/test-utils` selects its Nitro-3 adapter and the tests die on
      `Could not resolve "h3-next/generic"`. That is now encoded in
      `.ncurc.json` (`reject: ["h3"]`, plus `deep`, so `ncu -u` alone is the
      whole procedure) and explained in `CLAUDE.md`. Evidence: `pnpm check:ci`
      exits 0 with all 41 turbo tasks green.

- [x] 2026-08-28 - **The per-rule mutation pass is complete: all ten rules
      tightened, package 60.80% → 89.38%, floor ratcheted to 89.** Fourth and
      final wave (delegated to Codex CLI, verified independently) took
      `no-cross-module-deep-imports.ts` 68.52% → 94.44% and
      `no-hidden-top-level-declarations.ts` 78.29% → 94.08%; package 85.98% →
      89.38% (998 killed, 105 survived, 0 errors). Every rule now sits between
      80.47% and 94.44%. The 105 remaining survivors are the long tail
      (equivalent mutants and cosmetic message variants) - judged diminishing
      returns, so the item closes rather than chasing 100%. Evidence: own re-run
      of `pnpm run mutation` exits 0 - "Final mutation score of 89.38 is greater
      than or equal to break threshold 85" - and `pnpm vitest run` passes 251
      tests. `thresholds.break` raised to 89; any rule-logic change that weakens
      the suites now breaks the on-demand gate.

- [x] 2026-08-28 - **Third wave of the per-rule mutation pass: four more rules
      tightened, package floor ratcheted 77 → 85.** Delegated to Codex CLI with
      the 123 surviving-mutant diffs from a fresh run, verified independently.
      `file-kind-placement.ts` 65.22% → 93.04%, `one-primary-unit.ts` 62.84% →
      88.51%, `public-api-imports.ts` 66.67% → 94.44%,
      `view-logic-separation.ts` 62.65% → 86.75%; package 77.05% → 85.98% (960
      killed, 143 survived); every other rule unchanged. 36 RuleTester cases
      added across the four test files. Evidence: own re-run of
      `pnpm run mutation` exits 0 - "Final mutation score of 85.98 is greater
      than or equal to break threshold 77" - and `pnpm vitest run` passes 235
      tests. `thresholds.break` raised to 85. Only
      `no-cross-module-deep-imports.ts` (68.52%) and
      `no-hidden-top-level-declarations.ts` (78.29%) remain below 80.

- [x] 2026-08-28 - **The `check:quality` cold-run flake is closed as gone.**
      Fourth consecutive clean cold run
      (`rm -rf node_modules/.cache/turbo .turbo && pnpm check:quality`: 14/14
      tasks uncached, 6 gates, exit 0), the second on a distinct later day,
      which meets the item's own closing criterion. The original single failure
      was never reproduced; two concrete instances of its class were found and
      fixed along the way (`my-nextjs-app#type-check` depending on `^build`
      instead of its own `build`, 2026-08-24; pnpm not relinking a workspace bin
      when only the `bin` map changes, 2026-08-25, documented in
      `docs/standards/quality-gates.md`). The reporting half - the
      `scripts/check-quality.mjs` runner that names the failing step - stays, so
      any recurrence names itself.

- [x] 2026-08-28 - **Second wave of the per-rule mutation pass: three worst
      rules tightened, package floor ratcheted 67 → 77.** Delegated to Codex CLI
      with the 136 surviving-mutant diffs extracted from a fresh run, verified
      independently. `no-mixed-barrel.ts` 52.00% → 87.00%,
      `no-inline-types-in-runtime-files.ts` 54.40% → 85.60%,
      `no-inline-types.ts` 56.25% → 80.47%; package 67.68% → 77.05% (860 killed,
      234 survived); every other rule unchanged. 26 RuleTester cases added
      across the three test files; existing invalid cases now assert exact
      `messageId`, `data`, line and column. Evidence: own re-run of
      `pnpm run mutation` exits 0 - "Final mutation score of 77.05 is greater
      than or equal to break threshold 67" - and `pnpm vitest run` passes 199
      tests. `thresholds.break` raised to 77. Remaining per-rule work stays in
      TODO.md with the updated table.

- [x] 2026-08-28 - **Stryker no longer copies `coverage/` and `dist/` into its
      sandbox.** `ignorePatterns: ['coverage', 'dist']` added to
      `packages/eslint-plugin-code-policy/stryker.config.mjs` with a comment
      recording the `ENOENT ... copyfile ... coverage/base.css` crash that a
      concurrent `test` run caused mid-copy (observed 2026-08-27). Evidence:
      `pnpm run mutation` after the change exits 0 in 47s with the identical
      score - "Final mutation score of 67.68 is greater than or equal to break
      threshold 67" (755 killed, 321 survived, 0 errors).

- [x] 2026-08-27 - **`atomic-file.ts` mutation score 49.72% → 92.74%; package
      floor ratcheted 60 → 67.** First rule of the per-rule tightening pass
      (delegated to Codex CLI, verified independently). Survivors in
      `atomic-file.ts` fell 65 → 12; package score 60.80% → 67.68% (755 killed,
      321 survived); every other rule's score unchanged. Tests now assert exact
      `meta`, `messageId`, line/column, report count, and filename/AST
      boundaries instead of bare `messageId`. `stryker.config.mjs`
      `thresholds.break` raised to 67 with the ratchet comment updated.
      Evidence: own re-run of
      `pnpm --filter eslint-plugin-code-policy run mutation` exits 0 - "Final
      mutation score of 67.68 is greater than or equal to break threshold 67";
      package test suite 173 tests pass; eslint `--max-warnings 0` and
      `prettier --check` clean on both changed files. Remaining per-rule work
      stays in TODO.md with the new table.

- [x] 2026-08-27 - **The tsconfig lessons from a consumer are documented where
      the next adopter will look.** `packages/tsconfig/README.md` gained "The
      two root shapes" (single-project root extends a preset; multi-project root
      stays `{"files": [], "references": [...]}` with presets on the leaves, and
      why: `baseline-type-coverage` walks references, and the wrong shape once
      produced `type-coverage: ok . 0 / 0` over a whole repository) and "Next.js
      notes" (never include `.next/dev/types` - `TS1434` on a gitignored dev
      artifact reads as unfixable and gets the Next project dropped from
      `type-check`; and Next does not rewrite a tsconfig the preset completed,
      so it can leave `.prettierignore`). `docs/adoption/existing-repo.md`
      section 5 gained "What turning the strictness on actually costs": 33
      pre-existing findings in that consumer, all in `scripts/` and `e2e/`, two
      real bugs of the `name in obj` shape fixed with `Object.hasOwn`; plus the
      two adoption notes - the lint wave arrives WITH the tsconfig change (adopt
      eslint-config and tsconfig in one pass), and fixes belong at the source,
      never `?? ''` fallbacks. Evidence:
      `pnpm exec eslint <both files> --max-warnings 0` and `prettier --check`
      pass. Closes five TODO items in one pass.

- [x] 2026-08-27 - **Conformance grew a tsconfig column: solution references
      must reach `type-check`, and every project config must extend a preset.**
      Two new checks in `create-baseline` (`checkTsconfigProjects.mjs`,
      `checkTsconfigPresets.mjs`), `loadContext` now parses the root tsconfig
      (JSONC tolerated) and resolves a solution root's references, and the
      estate matrix gained a `tscfg` column. The first check diffs a solution
      root's `references` against the expanded `type-check` text (bare
      `tsc -b`/`vue-tsc -b` covers everything; a project-scoped `tsc -b x`
      covers only what it names); the second judges by shape - leaves must
      extend `@busirocket/tsconfig`, a solution root must not, a single-project
      root must. Verified: 162 tests pass (17 new); a scratch fixture
      reproducing that consumer's defect (three references, two type-checked,
      one hand-written leaf) yields exactly `tsconfig-project:tsconfig.app.json`
      and `tsconfig-preset:tsconfig.node.json`; the repaired consumer passes
      both checks legitimately; `pnpm estate ~/p` prints the column. Dogfooding
      caught the first offender: this repo's own root `tsconfig.json` was
      hand-written - it now extends `base.json` with `@busirocket/tsconfig`
      added as a root devDependency, and `create-baseline --check` here reports
      wiring OK. CHANGELOG carries an Unreleased entry; no version bump
      (release-time policy).

- [x] 2026-08-27 - **Advisory exceptions are machine-checked and expire.** Two
      advisories sat below the `--audit-level=high` gate, documented as prose in
      TODO.md that nothing re-checked and nothing expired. Replaced by
      `baseline-audit` (`@busirocket/quality-config`), which reads
      `.baseline-advisories.json`: a waiver needs both a `reason` and an
      `expires`, an expired waiver fails the build, and an entry missing either
      field is rejected rather than honoured. Because a judged finding now has
      somewhere to live, the gate moved from `high` to `moderate` - strictly
      stricter than before. Verified all three paths: current state exits 0 with
      one waived moderate finding, an entry back-dated to 2020-01-01 exits 1 as
      EXPIRED, and running with no allowlist exits 1. Both live entries expire
      2026-11-30.

- [x] 2026-08-26 - **cargo-baseline reads the declaring `mod`, so a
      `#[cfg(test)] mod name;` file is test scope without an inner attribute.**
      New `engine/cfg_test_module_paths.rs` resolves those declarations across
      the crate's parsed files (2018-edition module resolution, both `name.rs`
      and `name/mod.rs`, test scope inherited through plain child modules), and
      `is_test_scope_file` takes the resulting set. Verified against a fixture
      reproducing the consumer's shape: before, 23 test `unwrap()` calls counted
      as production plus a spurious `file-matches-item` error; after, zero of
      each. That crate now anchors the tip at `src/ops/clean_name.rs` with the
      correct crate total of 45. 100 tests pass.
      `docs/guides/rust-baseline-adoption.md` no longer asks adopters to add
      `#![cfg(test)]` for this tool's sake.

- [x] 2026-08-25 - **Ran 0.7.0 / 0.5.0 against the estate before either reached
      npm, and it found three defects.** 22 repos adopt
      `eslint-plugin-code-policy`, four carry a Rust crate, nine commit a
      `.jscpd.json`. Nothing had been published yet, so every one of these was
      caught before a consumer saw it.
  - **`file-kind-placement` flagged 45 React components.** 0.7.0 stripped the
    extension before the suffix check, which is right for `orderMapper.tsx` and
    wrong for `MarketSelector.tsx`. Enumerated across `~/p`: all 45 files newly
    matching a kind suffix on a `.tsx` extension were PascalCase components,
    zero were misplaced units. Reproduced in a consumer widget, 0 errors to 11.
    `is-component-filename` now holds the one definition of "component file",
    shared with the colocation anchor that had it inline.
  - **`one-primary-unit` flagged two idioms that cannot be split.**
    `export const { handlers, auth, signIn, signOut } = NextAuth(config)` (one
    consumer, 3 errors) and
    `export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)`
    (another, 4 errors), both verbatim from their official setup guides. The
    factory returns one object; splitting means calling it twice. A declarator
    whose init is a call or `new` now counts once, and
    `export const { first, second } = source` still counts as two.
  - **`baseline-dupes` could not express what five of nine repos need.** jscpd's
    `--ignore` replaces the config's list rather than merging - measured, 61
    files / 1 clone became 109 files / 4 clones - so a repo with one generated
    directory to exclude (Supabase types, migrations, a cpanel build) would have
    restated every shared pattern in its own script. `--also-ignore` merges
    through a generated config. The runner was also splitting arguments into
    paths and flags on a leading dash, which handed `120` to jscpd as a
    directory and silently dropped the flag after a `--config`; arguments are
    now forwarded untouched.
  - **What held up.** `cargo baseline check` matched the published binary's
    error counts on all four crates (0, 20, 22 and 0) while correcting the
    unwrap-density tips: in the largest, 906 calls blamed on one arbitrary file
    became 11 real ones, and 475 became 45 in another. That crate's file count
    went 523 to 538 with `tests/` read, no new errors. The canonical jscpd
    config reproduced its own result exactly (1866 files, 61 clones).
  - Evidence: A/B lint sweep across all 21 adopting repos with the plugin
    installed, before and after, **0 deltas**; every repo restored and verified
    byte-identical afterwards. 146 plugin tests, `check:ci` / `check:quality` /
    `check:security` exit 0, `cargo test` 94 pass, clippy clean. Shipped as
    code-policy 0.7.1, quality-config 0.6.0, create-baseline 0.3.4.

- [x] 2026-08-25 - **`check:quality` names the gate that fails.** It was
      `pnpm knip && pnpm knip:templates && ...`, six gates behind one exit
      code - the reason a cold-run failure got recorded as "check:quality
      failed" and could never be acted on. `scripts/check-quality.mjs` keeps the
      chain's semantics (in order, first failure stops) and prints
      `check:quality: FAIL     <step> (exit <code>)` plus the `pnpm run <step>`
      to re-run. Verified both directions: the real run prints all six `running`
      lines and `6 gates passed`, exit 0; a probe copy with an injected bad step
      prints `check:quality: FAIL     definitely-not-a-script (exit 1)` and
      exits 1. `docs/standards/quality-gates.md` documents it, along with the
      pnpm bin-relink trap that produced one such failure locally.

- [x] 2026-08-25 - **Next 16.3.2, two security overrides gone, and one flag that
      explains why.** Closes the `[!]` that had held since 2026-08-04.
  - **The alias is not rejected by Next 16.3 - its `tsc` bin is.** Next 16.3
    flipped `experimental.useTypeScriptCli` to default-on, and that path locates
    the compiler through the resolved `typescript` package's own `bin.tsc`.
    `@typescript/typescript6@6.0.2` declares `bin.tsc6` and nothing else, so
    `getTypeScriptPackageInfo` returns `tscPath: undefined` and `next build`
    aborts with "It looks like you're trying to use TypeScript but do not have
    the required package(s) installed" - having first run
    `pnpm install --save-dev typescript` over the alias. Everything the check
    actually resolves is fine: probed `hasNecessaryDependencies` from the
    template directory with Next's own module and it returns `missing: []`.
  - **`experimental.useTypeScriptCli: false` fixes it.** That sends Next back to
    the compiler API entry (`lib/typescript.js`), which resolves through the
    alias normally. Measured on 16.3.2: build fails without the flag, succeeds
    with it, type-checks in 1.5s. The flag is experimental and the template
    carries a comment saying exactly what removes it - the alias shipping a
    `tsc` bin, or a move to a real `typescript` package.
  - **Two of the three load-bearing overrides are now dead.** Deleted
    `sharp@<0.35.0` (GHSA-f88m-g3jw-g9cj) and `postcss@<8.5.18`
    (GHSA-6g55-p6wh-862q / GHSA-r28c-9q8g-f849) from `pnpm-workspace.yaml` and
    reinstalled: `pnpm audit --audit-level=high` exits 0, total findings still 2
    (1 low, 1 moderate - the pair deliberately left below the gate). `tmp`
    stays: `@lhci/cli` is still 0.15.1 and has no newer floor.
  - **The pins are ranges again.** `next`, `eslint-config-next` and
    `@next/eslint-plugin-next` go from an exact `16.2.12` to `^16.3.2`, and
    `docs/adoption/new-repo.md` no longer tells adopters the ceiling is
    untested - it gives them the flag and the measurement.
  - Evidence: `pnpm check:ci` 39/39 exit 0, `pnpm check:quality` exit 0,
    `pnpm check:security` exit 0 (gitleaks clean, audit clean at `high`,
    actionlint clean), `pnpm perf:check` exit 0, `pnpm sync-versions:check` in
    sync.

- [x] 2026-08-25 - **Release tags: the convention is now checked, not
      remembered.** `scripts/release-check.mjs` reads `git cat-file -t` for
      every tag and warns on each lightweight one, naming it and the
      `git tag -a <tag> -m "<message>"` form that avoids the next. It warns
      rather than fails, because a pushed release tag is immutable and nine of
      them already exist. README's publish section states the convention.
  - **The backlog entry undercounted.** It said three lightweight tags, all cut
    2026-08-04, with everything before them annotated. The check reports nine of
    twenty: `create-baseline@0.2.0`, `0.2.1`, `0.3.2`, `eslint-config@0.4.1`,
    `0.4.2`, `0.6.0`, `eslint-plugin-code-policy@0.5.1`, `0.5.2` and
    `quality-config@0.3.0`. The habit predates the date the entry blamed.
  - Evidence: `pnpm release:check --no-npm` exits 0 with the warning block and
    six packages reported fully released; `eslint scripts --max-warnings 0`
    clean.

- [x] 2026-08-25 - **Two gates that were quietly not gating.**
  - **`file-kind-placement` was blind to every `.tsx` file.**
    `endsWith('Mapper.ts')` and its four siblings anchored kind detection on
    `.ts`, so `orderMapper.tsx` reported nothing while `userMapper.ts` beside it
    reported `code-policy/file-kind-placement` - and in a React codebase the
    `.tsx` half is where mappers and formatters actually get written.
    `utils/strip-code-extension` removes the extension first, covering `.tsx`,
    `.js`, `.jsx` and the `.mts`/`.cts`/`.mjs`/`.cjs` variants. Probed across
    all eight templates before shipping: zero new findings, so the fix widens
    coverage without moving any existing file.
  - **The jscpd config stopped being nine copies.** `.jscpd.json` sat byte for
    byte in the repo root and all eight templates, and every adopting project
    had to copy it again - the only gate in the set that was hand-maintained
    duplication rather than shared config. It now lives once, as `jscpd.json`
    inside `@busirocket/quality-config`, with a `baseline-dupes` runner that
    points jscpd at it and forwards any extra flag. The nine files are deleted;
    `dupes` is `baseline-dupes .` in templates and
    `baseline-dupes packages scripts` at the root.
  - **The factory the TODO asked for is not possible, and that is the finding.**
    jscpd 5.x is a Rust binary that reads JSON only - no JS config loader - so
    `createJscpdConfig` could only have generated a file each consumer still
    committed, which is the duplication being removed. A JSON file read in place
    plus a runner is the equivalent that actually removes it; the config is also
    resolvable directly as `@busirocket/quality-config/jscpd`.
  - **knip needed telling, twice.** With the script no longer naming `jscpd`,
    knip reported it as an unused devDependency in all eight templates - the
    dependency is real, the runner spawns the binary rather than vendoring it.
    Added to `ignoreDependencies` in both places that judge a template: the root
    `knip.config.ts` (`pnpm knip`) and `createKnipConfig`
    (`pnpm knip:templates`, and the gate a scaffolded project runs). Declaring
    `jscpd` an optional peer of `quality-config` instead was tried and rejected:
    it trades eight errors for one, `Referenced optional peerDependencies`, and
    knip scores that at error level too.
  - Evidence: `pnpm check:ci` 39/39 tasks, exit 0; `pnpm check:quality` exit 0;
    `pnpm knip` and `pnpm knip:templates` exit 0 (both were exit 1 mid-change,
    measured); `turbo run dupes --force` 8/8 templates, 0 clones each; root
    `pnpm dupes` 4 clones at 0.48% tokens, under the 1% threshold, unchanged
    from before; `eslint-plugin-code-policy` 138 tests pass. CHANGELOG
    `Unreleased` entries added to both packages; no version bumps.

- [x] 2026-08-25 - **cargo-baseline: test scope answered once, and clippy
      actually runs.** Four backlog items that all turned on the same question -
      what counts as test code.
  - **`check` now walks `<crate>/tests`, not just `<crate>/src`.** Cargo
    integration tests were outside every rule, never read rather than
    deliberately exempted. `parse_source_files` takes both roots, and
    `collect_rust_files` skips any directory with its own `Cargo.toml` - without
    that, this crate's deliberately-broken fixture at
    `tests/fixtures/bad-crate/src/store.rs` reported its three planted errors
    against cargo-baseline itself (measured: `baseline check .` went from clean
    to 3 errors before the guard was added).
  - **Which rules speak in test scope is now one decision, not five.**
    `Rule::applies_to_test_scope` defaults to `false` and `run_rules` filters;
    `max-file-lines` and `sync-tauri-command` dropped their private copies of
    the guard. `no-inline-sql` is the one opt-in: a fixture query is still a
    query, and a large one diffs better as `sql/*.sql` behind `include_str!`. An
    inline `#[cfg(test)] mod` block inside a production file stays exempt - a
    table-driven test spells its rows out. Pinned by
    `check_reads_cargo_integration_tests_for_sql_only`, which asserts
    `tests/integration.rs` reports `no-inline-sql` and does _not_ report
    `one-primary-unit` on its second `#[test]` fn.
  - **`is_cfg_test_item` reads the whole predicate.** It parsed the attribute
    args as a single `syn::Ident`, so `#[cfg(all(test, feature = "x"))]` and
    `#[cfg(any(test, debug_assertions))]` both returned `false` and every rule
    downstream scanned those modules as production code.
    `engine/cfg_meta_mentions_test` walks `all(..)`/`any(..)` recursively and
    deliberately does not descend into `not(..)`, so `#[cfg(not(test))]` stays
    production.
  - **`unwrap-density` counts production calls and points at the worst file.**
    The tip read `./src/baseline_command.rs:1: 54 unwrap()/expect() calls`
    against a 20-line file - the crate total pinned to whichever file parsed
    first. `engine/production_unwrap_lines` returns one entry per call outside
    test scope and outside comment lines (the scan is textual, so prose naming
    the calls counted itself), and the tip anchors to the file contributing the
    most, at its first call. Re-measured on the crate itself: 54 against a wrong
    file became no tip at all - 13 production calls, then 9 once comment lines
    stopped counting, under the threshold of 10.
  - **clippy runs in CI.** `Cargo.toml` has declared `unwrap_used`,
    `expect_used` and `panic` as `deny` since the crate landed, and the `rust`
    job ran `fmt` and `test` only; the crate has no `package.json` so
    `turbo run lint` never reached it either. Added
    `cargo clippy --workspace --all-targets -- -D warnings`, and the job is now
    named `Rust` rather than `Rust tests`. It reports nothing today, which is
    the point: the deny list was already satisfied and unguarded.
  - Evidence: `cargo test --workspace` 94 passed / 0 failed (90 unit + 4
    integration, up from 87);
    `cargo clippy --workspace --all-targets -D warnings` clean;
    `cargo fmt -- --check` clean; `cargo run -- baseline check .` reports 0
    errors 0 tips; same on `templates/tauri-app/src-tauri`; `actionlint` clean.
    README and `docs/guides/rust-baseline-adoption.md` rewritten for the new
    scope rules.

- [x] 2026-08-24 - **Adoption backlog cleared:** the twelve findings that three
      real adoptions left open.
  - **`createKnipConfig` is configurable instead of a fixed preset.** Four
    findings reduced to that. A drizzle schema aggregator reported every table
    as a dead export - `drizzle.config.ts` is its only consumer - and acting on
    that report makes the next migration emit `DROP TABLE`; `ignore` excludes
    it. knip's drizzle plugin loads `drizzle.config.ts`, which throws without
    `DATABASE_URL`, so the gate needed a live database; only `drizzle: false`
    stops it, not `ignore`. A finished-but-unwired package reported its whole
    public API as dead under `includeEntryExports: true`; it is per workspace
    now. And `ignoreBinaries` no longer defaults to `['turbo', 'lhci']` - both
    resolve in every template that has them, so the entries only ever produced a
    hint no consumer could silence. `@vitest/eslint-plugin` and
    `eslint-plugin-testing-library` left the shared ignore list for the same
    reason, measured across all eight templates. Hints: 21 to 5.
  - **The zod idiom no longer fights the atomic-file rules.**
    `export const fooSchema = z.object(...)` plus
    `export type Foo = z.infer<typeof fooSchema>` tripped both
    `one-primary-unit` and `no-inline-types-in-runtime-files` - 158 of 296
    findings in one repo, and one whole package was nothing else. Unwinnable per
    file: the type cannot move without importing the schema back. `z.infer` /
    `input` / `output` / `TypeOf` and drizzle's `$inferSelect` / `$inferInsert`
    are exempt when the value is declared in the same file; derived from an
    import it is still a second unit, which the tests pin.
  - **Both missing runners now ship.** `baseline-type-coverage` runs
    `type-coverage --strict` per workspace, reading the threshold from the
    package's own constant so the two cannot drift; this repo deleted
    `scripts/type-coverage.mjs` and runs the bin (11 workspaces, same result).
    `baseline-deps-graph` cruises each workspace with its own tsconfig, which is
    what a repo-wide cruise cannot do with one `tsConfig` - the reason one
    adopter dropped dependency-cruiser rather than work around it.
  - **`cargo-baseline` recognises file-level test modules.** A
    `#[cfg(test)] mod tests;` body, or any `#![cfg(test)]` file, was scanned as
    production code. `engine/is_test_scope_file` answers it once for both rules;
    `no-inline-sql` had no path exemption at all before and now also skips SQL
    inside an inline `#[cfg(test)] mod` block by line range. The `tests` path
    component is only honoured after the last `src`, because a crate can itself
    live under `tests/` - this crate's fixtures do, and the integration test
    caught the over-broad first attempt.
  - **New rule: `sync-tauri-command`.** Tauri runs a non-async command on the
    main thread, so disk, DB or network work in one freezes the UI. Opt out per
    command with `// baseline:allow sync-tauri-command`, or per crate through
    `disabled_rules`. Dogfooding found the template's own `greet` (now marked,
    with a comment saying why) and a `one-primary-unit` violation in the rule's
    own file, which moved the `#[tauri::command]` detection into
    `engine/has_tauri_command_attribute` and removed the duplicate closure in
    `tauri-command-placement`.
  - **The last TypeScript peer context is gone.** `vue-app` and `nuxt-app`
    declared plain `typescript` because vue-tsc was assumed to need it; both
    type-check unchanged against the `npm:@typescript/typescript6` alias. That
    was what still split `eslint-plugin-boundaries` in two - the lockfile now
    holds one peer-resolved key and all five consumers resolve the same copy.
  - **Adoption docs name the two steps that ambushed people:** pnpm 11's
    `allowBuilds` (the `pnpm.onlyBuiltDependencies` field the error suggests is
    ignored), and counting the workspaces with no ESLint config at all before
    estimating - one repo had five, ~800 files, 1,118 findings. The Next
    dependencies in `templates/nextjs-app` are pinned exactly, because Next
    16.3.x rejects the TypeScript alias and a caret range handed fresh adopters
    a broken `next build`.
  - Evidence: `pnpm check:ci` exit 0 (39 tasks), `pnpm check:quality` exit 0,
    `pnpm knip` and `pnpm knip:templates` exit 0, `pnpm perf:check` exit 0 (6
    lighthouse templates), `pnpm dupes` 0.39%, `cargo test --workspace` 81
    passed, `cargo fmt -- --check` clean, and `cargo baseline check` reporting 0
    errors against the crate itself.

- [x] 2026-08-24 - **CI green on `main` for the first time since 2026-08-12**,
      plus the four follow-ups the testing-gap work left behind.
  - **The security gate is fixed, not silenced.**
    `pnpm audit --audit-level=high` reported four high advisories. Three took
    ordinary overrides: GHSA-5p4m-2wfm-xmqj in js-yaml (one entry per live
    major, since a single `<4.3.1` range would drag the 3.x line across a major)
    and GHSA-2v37-7h3g-55p8 in nanoid, via
    `prettier-plugin-css-order > postcss`. The fourth, GHSA-jmr9-qjv8-65gv in
    extract-zip, has **no patched release** - npm's latest is the vulnerable
    2.0.1, and pnpm refuses the override with "The latest release of extract-zip
    is 2.0.1". Fixed by moving the consumer instead: `@puppeteer/browsers@3.2.1`
    dropped extract-zip entirely for `modern-tar`, so an override to `^3.2.1`
    removes the edge. Verified the browser download still works by running
    `perf:check` end to end on `astro-site` (`Healthcheck passed!`, exit 0), not
    just by re-reading the audit. `pnpm audit --audit-level=high` now exits 0
    with 2 remaining findings, both below the gate.
  - **`typescript-eslint` aligned to `^8.67.0` across all nine packages**, which
    was the version skew that split `eslint-plugin-boundaries` and broke the
    config on 2026-08-24. The lockfile went from three plugin keys to two; the
    remaining split is the TypeScript alias, recorded as still open.
  - **`cargo fmt` applied and gated.** The crate had drifted at 29 places across
    14 files; `cargo fmt --all` fixed it and the `rust` CI job now runs
    `cargo fmt -- --check` before the tests. 63 tests still pass and
    `cargo run -- baseline check` still reports 0 errors on the crate itself.
  - **`templates/nextjs-app` no longer relaxes the size standard.** Its
    `eslint.architecture.ts` set `max-lines` to a 200-line warning for every
    file and 300 for components, and being spread last it beat
    `createCodeQualityConfig()`'s error at 100. Deleted after checking that no
    file in the template exceeds the real budget; the template lints clean at
    error-100. The legitimate App Router exception already lives in
    `code-quality.ts`.
  - **`one-primary-unit` now counts bound names rather than declarators.**
    `export const { first, second } = source` is one declarator, so a file
    exporting two symbols used to pass. Both it and
    `no-hidden-top-level-declarations` now share one binding-pattern walk
    (`utils/bound-identifier-names.ts`, five unit tests) instead of each
    carrying its own, so the two cannot drift on what a pattern binds. The
    Next.js route exemption is applied per name.
  - **`atomic-file` and `no-inline-types` are marked deprecated** with
    `replacedBy`, rather than removed - both have been `'off'` in the
    recommended config since the narrower rules replaced them, and a consumer
    who enabled them directly stays working. Excluding them from the coverage
    gate as unsupported surface puts the package at 95.29% statements, 85.35%
    branches, 100% functions, 96.61% lines over 127 tests.
  - Evidence: `pnpm check:ci` exit 0, `pnpm knip` exit 0,
    `pnpm audit --audit-level=high` exit 0, `cargo test --workspace` 63 passed,
    `cargo fmt -- --check` clean, `actionlint` clean, and CI run 32775048272
    green on all four jobs - Verify, Quality gates, Rust tests and Security
    gates - which is the first fully green `main` since 2026-08-12.

- [x] 2026-08-24 - **Testing gaps:** close the five items the test-policy audit
      opened the same day.
  - **Coverage was declared but never measured.** Seven templates carried
    `thresholds: { lines/functions/branches/statements: 80 }` while their script
    was a bare `vitest run`, so the gate never ran and turbo's
    `outputs: ["coverage/**"]` produced the `no output files found` warning on
    every CI run. Measured first, then enabled: all seven report 100% on every
    metric, so `--coverage` was free to turn on. `nestjs-app` had no thresholds
    at all and sat at 23% - `main.ts` and `app.module.ts` are now excluded as
    bootstrap/DI wiring, a missing `app.controller.spec.ts` was added, and it
    reports 100% statements/functions/lines. It carries no `branches` threshold
    on purpose: Nest's class decorators compile to code v8 attributes to the
    decorated line, so `@Controller()` alone reports an unreachable uncovered
    branch (50%, 1/2).
  - **`packages/eslint-plugin-code-policy` had no thresholds either**, and
    measuring it found real holes rather than phantom ones: 84.4% statements and
    73.64% branches. Rather than lower the bar, the two least-covered paths got
    tests - `no-hidden-top-level-declarations` (47.61% statements: export
    specifier lists, `export default` identifier and HOC unwrapping,
    object/array/rest destructuring) and `one-primary-unit` (51.85% branches:
    specifier-list exports and the Next.js route exemption reached through one).
    107 tests became 120, and the package now reports 93.27%/81.17%/ 100%/94.78%
    against an 80% gate, with the barrel, version constant and shipped presets
    excluded as declarative wiring.
  - **`cargo test` never ran in CI.** `packages/cargo-baseline` has no
    `package.json`, so it is not a pnpm workspace member and `turbo run test`
    skipped it; no workflow step covered it either. A `rust` job now runs
    `cargo test --workspace` (GitHub's ubuntu runners ship a stable toolchain,
    so no third-party toolchain action was added). 63 tests, green.
  - **Rust and TypeScript disagreed on whether tests cost file budget.**
    `max-file-lines` counted the lines of an inline `#[cfg(test)] mod tests`
    block against the file, while a TS test file now gets its own budget. A new
    `engine/cfg_test_line_ranges.rs` returns the inclusive line ranges of those
    blocks and the rule skips them, so the budget measures production code on
    both sides. Spans are read off single tokens (`#` of the first attribute,
    the closing brace of the block) because proc-macro2 cannot join spans on
    stable and an item-level `span()` collapses to its first token. Verified by
    two new rule tests plus three for the helper, and
    `cargo run -- baseline check` still reports 0 errors against the crate
    itself.
  - **jscpd's `minTokens: 70` was left alone, deliberately.** Measured at 30
    over test globs: 12 clones, 9.55%. Ten of them are the same starter file in
    different templates (`tauri-app` vs `vite-react-app` vs `vue-app`), which is
    what templates are for, and the rest are import + `afterEach` headers whose
    extraction would make the tests worse. Per template the signal is one clone
    in `vue-app` (a 6-line fetch stub) and one in `astro-site` (an import
    header); nextjs-app has none. The percentages only look alarming because the
    denominators are 44-82 lines. No change to the gate.
  - **The rule tester no longer casts.** `@typescript-eslint/rule-tester`
    replaced ESLint core's `RuleTester`; it is generic over the same
    `RuleModule` shape `createRule()` produces, so both cast type aliases are
    gone and no suite carries `as any`. This required aligning
    `@typescript-eslint/utils` to `^8.67.0`: the tester pulled its own copy and
    two versions of the same types are structurally incompatible under
    `exactOptionalPropertyTypes`. The undeclared `@typescript-eslint/parser`
    that the old helper reached through hoisting is gone with it - the tester
    defaults to that parser.
  - Evidence: `pnpm check:ci` exit 0 (39 turbo tasks), `pnpm knip` exit 0,
    `pnpm dupes` exit 0, `cargo test --workspace` 63 passed, `actionlint` clean.

- [x] 2026-08-04 - **Consumer findings:** Fix the five gaps that adopting the
      standard in a consumer (Next.js 16, ESLint 10.8) exposed.
  - Result: `quality-config` 0.4.0. The knip Next.js preset named
    `middleware.ts`, renamed `proxy.ts` in Next 16, so the proxy read as an
    unused file; it now matches either in one pattern, and the App Router
    metadata routes plus `global-error` joined the entry alternation. The
    dependency-cruiser `no-orphans` exemptions covered only `sitemap` and
    `robots`, so a normal App Router reported one orphan per route file; every
    convention is exempt now, at any depth, and so is `middleware`/`proxy`.
  - The exemptions are two patterns rather than one with `(.*/)?` on purpose:
    dependency-cruiser runs every `pathNot` entry through safe-regex and
    **abandons the whole rule** when one is rejected, so a nested quantifier
    turns the orphan check off instead of narrowing it. Verified directly -
    `safe-regex` rejects `(^|/)app/(.*/)?(page)\.tsx?$` and accepts both new
    forms - and documented in the factory and in `quality-gates.md`.
  - The adoption guide now says to delete any inherited
    `settings: { react: { version: 'detect' } }` override: it reinstates the
    detection `createNextjsConfig` exists to avoid, and on ESLint 10 that is not
    a warning but every file failing at
    `Error while loading rule 'react/display-name'`.
  - The `Remove from ignoreDependencies` hints are documented as expected rather
    than patched: the preset's ESLint peer list is redundant in the one layout
    where knip resolves the real caller and load-bearing in every other, and a
    consumer-side filter would drift the moment the list changes.
  - Released as `quality-config@0.4.0` through the `publish.yml` workflow
    (tokenless OIDC trusted publishing - there is no local npm credential to
    have, which is what the 401 from `npm whoami` was really saying), on an
    annotated tag. `pnpm release:check` reports all six packages fully released.
    That consumer is on `^0.4.0` with its local patches deleted and both gates
    green, which is the acceptance test passing for real rather than against a
    working copy.
  - Evidence: the new patterns were unit-checked against 13 real consumer paths
    (route files, nested routes, metadata routes, `src/proxy.ts`, and the
    near-misses `app/blog/mypage.tsx` and `src/lib/route.ts`),
    `pnpm check:quality` passes here, and the consumer passes `knip` and
    `deps:graph` with its local patches deleted and this factory in place.

- [x] 2026-08-04 — **release:** cut `eslint-config@0.6.0`,
      `quality-config@0.3.0` and `create-baseline@0.3.2` up to the tag. Both
      minors are behavior changes rather than patches: the React presets now
      report a concrete `settings.react.version` and accept a `reactVersion`
      option, and the knip Next.js preset changes what a `src/app` project sees.
      `eslint-config` also carried one patch that had been unreleased since
      `0.5.0` - the `.lighthouseci/` ignore from `cb20628`. `create-baseline`
      follows because `baseline-versions.json` pins the two bumped packages, the
      same pairing as the `0.3.1` release.
  - Result: three tags on `ac7b511`, pushed, and all three published to npm
    through the manual `publish.yml` `workflow_dispatch` (tokenless OIDC),
    `create-baseline` last so it never pinned a version npm did not yet serve.
    `pnpm release:check` -> `6 packages fully released.`
  - Evidence: `pnpm run check:ci`, `check:quality` and `check:security` all exit
    `0` before the tag; `sync-versions --check` reports derived files in sync;
    workflow runs `30902237324`, `30902305336`, `30902401887` all successful;
    `npm view` returns `0.6.0` / `0.3.0` / `0.3.2`.
  - Note: these three tags were created lightweight while every earlier release
    tag is annotated. They are pushed and immutable, so the fix belongs to the
    next release - tracked in `TODO.md`.
  - Files: `packages/{eslint-config,quality-config,create-baseline}/`
    `package.json` and `CHANGELOG.md`,
    `packages/create-baseline/baseline-versions.json`.

- [x] 2026-08-04 — **security:** three newly published `high` advisories broke
      `pnpm audit:check`, and the gate is green again. They were not caused by
      any change in this repo: audit resolves against the live advisory
      database, and the same three appear on the untouched lockfile at `HEAD`.
      `ip-address@<10.3.1` (GHSA-mwp4-54f8-5fhr, via
      `@lhci/cli > proxy-agent > socks`) and `brace-expansion` on two majors
      (GHSA-rgw5-rvv9-x895, via `nuxt > @nuxt/nitro-server` and via
      `eslint > @eslint/config-array > minimatch`). All three survived
      `pnpm dedupe`, so they took the documented route: scoped entries in the
      `overrides:` block. The `brace-expansion` entries are lower-bounded
      (`>=2.0.0 <2.1.4`, `>=5.0.0 <5.0.9`) rather than the obvious
      `brace-expansion@<2.1.4`, which would also capture the installed `1.1.18`
      edge - an edge the advisory does not flag - and drag it across two majors.
      The `ip-address` pin to `^10.3.1` also cleared the two `moderate`
      `ip-address` findings, which were patched at `10.2.1` and `10.2.2`.
      Separately, `@vitest/eslint-plugin` went `1.6.25 -> 1.6.26` across the
      nine workspaces that declare it, which removed one of the paths feeding
      the low `esbuild` advisory.
  - Result: `pnpm audit` goes from `1 low | 3 moderate | 3 high` to
    `1 low | 1 moderate`; `pnpm audit --audit-level=high` exit `0`.
  - Evidence: `pnpm run check:security` exit `0` (gitleaks `no leaks found`,
    audit, actionlint); `pnpm run check:ci` exit `0`; `pnpm run check:quality`
    exit `0`.
  - Files: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, nine `package.json` files
    under `packages/` and `templates/`.

- [x] 2026-08-04 — **eslint-config:** the React presets no longer depend on
      `eslint-plugin-react`'s own version detection, which is broken on
      ESLint 10. `settings.react.version` was `'detect'`, and detection calls
      `context.getFilename()`, removed in ESLint 10, so a consumer on
      `eslint@10` fails every file with
      `contextOrFilename.getFilename is not a function` before a rule runs. This
      repo could not see it: `patches/eslint-plugin-react.patch` fixes
      `resolveBasedir` locally, so the templates lint green while external
      consumers crash - the patch is what made this a report from a consumer
      rather than a failing gate here. `createNextjsConfig` and
      `createViteReactConfig` now resolve the React installed beside the linted
      project (`resolveReactVersion`, `require.resolve('react/package.json')`
      from `process.cwd()`) and hand the plugin a concrete version, with a new
      `reactVersion` option to override and `'detect'` only as the last
      fallback. The settings live in an unscoped config object because the two
      `eslint-plugin-react` flat configs carry no `files` key, so a file outside
      `**/*.{js,jsx,ts,tsx}` would otherwise re-enter detection.
      `createViteReactConfig` was fixed alongside `createNextjsConfig`: the
      report named only the Next.js preset, but `vite-react.ts` had the
      identical `'detect'` setting.
  - Evidence: probe from `templates/nextjs-app` returns `[{"version":"19.2.8"}]`
    (one settings entry, no `detect`) and
    `createNextjsConfig({ reactVersion: '18.3.1' })` returns
    `[{"version":"18.3.1"}]`; `eslint src --max-warnings 0` and `tsc --noEmit`
    clean for the package; `turbo run type-check lint` 24/24 successful.
  - Files: `packages/eslint-config/src/react-version.ts` (new),
    `packages/eslint-config/src/nextjs.ts`,
    `packages/eslint-config/src/vite-react.ts`.

- [x] 2026-08-04 — **quality-config:** the knip Next.js preset now covers the
      `src/app` layout. Entry globs were rooted at `app/`, so a project using
      `src/app/` matched none of them. The reported symptom (knip exits 0 having
      inspected nothing) did not reproduce; the measured behavior is worse in a
      different way: with no entry matching, knip reports the application's own
      route files as **unused files** and never checks their exports. Probe on a
      `src/app` fixture, old patterns: `Unused files (2)` naming both
      `src/app/y/page.tsx` and `src/lib/orphan.ts`, and the dead export in
      `page.tsx` is not reported. New patterns: only the real orphan is flagged
      and `deadEntryExport` surfaces as an unused export. Fixed by carrying both
      roots in one pattern - `{,src/}app/**/{page,layout,...}.{ts,tsx}` and
      `{,src/}middleware.ts` - rather than adding a `srcDir` option: verified
      with knip's own glob engine (`tinyglobby`) that `{,src/}` matches both
      layouts, so neither produces a `Refine entry pattern (no matches)` hint.
      `next.config.*` stays root-only, where Next.js requires it.
  - Evidence: knip probe above; `pnpm knip` and `pnpm knip:templates` both exit
    `0` with no new hint for the `templates/nextjs-app` entry patterns.
  - Files: `packages/quality-config/src/knip-framework.ts`.

- [x] 2026-08-04 — **docs:** the peer packages each `@busirocket/eslint-config`
      subpath needs are now listed per subpath. The reported gap -
      `createCodeQualityConfig` failing a consumer's `tsc --noEmit` with
      `Cannot find module 'eslint-plugin-testing-library'` - was documentation,
      not the manifest: the plugin was already an optional peer, and the
      manifest is right, because the plugin is only mandatory for the subpaths
      that reach `./testing`. The README `Stacks` table gained an
      `Install alongside` column covering all twelve subpaths, plus the reason
      the list is longer than `peerDependencies` suggests: the package ships raw
      `.ts`, so its imports resolve from the consumer and pnpm's isolated
      `node_modules` requires a direct declaration even for the config's own
      `dependencies`. `docs/adoption/existing-repo.md` points at that table and
      calls out the two easy misses (`/code-quality` needing the testing
      plugins, `/nextjs` and `/vite-react` needing `eslint-plugin-boundaries`)
      and the ESLint 10 React-version note.
  - Evidence: `pnpm format:check` clean; `pnpm knip` exit `0`.
  - Files: `packages/eslint-config/README.md`, `docs/adoption/existing-repo.md`.

- [x] `type-coverage` is not incompatible with the `@typescript/typescript6`
      alias. The blocker was misattributed and the gate now runs. Every failing
      run had been invoked through `npx`, which installs `type-coverage` into
      its own cache directory, so `require('typescript')` resolved from there
      rather than from the workspace and returned a module without
      `SyntaxKind` - hence
      `TypeError: Cannot read properties of undefined (reading 'Unknown')` at
      load time. Installed as a workspace dependency it resolves this repo's
      aliased compiler and works: `packages/eslint-config` reported 99.74% on
      the first such run. The general lesson: a tool that consumes the
      TypeScript compiler API has to be resolved from the same tree as the
      compiler, so running it through `npx` is not a test of compatibility.
      Wired as `pnpm type-coverage` (`scripts/type-coverage.mjs`), one run per
      workspace that has its own `tsconfig.json`, at 99% with `--strict`, and
      added to `check:quality`. The threshold is read from
      `@busirocket/quality-config/type-coverage` through jiti rather than
      restated, so the published constant and the gate cannot drift; the same
      shape as `scripts/deps-graph-aliased.mjs`, so no new published surface was
      needed. Exclusions are exactly two: framework build output (`.next/`,
      `.nuxt/`), whose `any`s belong to the generator, and tests, where casting
      a rule or a mock to `any` is the point. Adoption found one real defect:
      `NestFactory.create()` returns `INestApplication<any>`, holding
      `templates/nestjs-app` at 96.07%; annotating the binding as
      `INestApplication<unknown>` type-checks and takes it to 100%. Verified:
      all eleven workspaces pass (four at 100%), an injected
      `export const anyProbe = (value: any): any => value` fails the gate and
      names both positions, probe removed, `pnpm check:ci` exit 0,
      `pnpm check:quality` exit 0. `docs/standards/quality-gates.md` rewritten -
      its "type-coverage - dropped, not a gate" section and the "documented
      debt" note about the dormant export are both obsolete.

- [x] The pre-commit lint hook could not lint the files it existed for.
      `pnpm exec eslint <path>` run at the repo root resolves each plugin's own
      dependencies against the root `node_modules`, which a pnpm workspace does
      not have, so staging any file in a Tailwind template aborted the hook with
      `Error: Could not find tailwindcss` before a single rule ran. Found by
      hitting it: the commit for the knip change, which touches
      `templates/vue-app/src/main.ts`, failed. ESLint itself was never the
      problem - it walks up from the file and finds the right config; the
      plugins' runtime lookups need the workspace as the working directory.
      `scripts/lint-staged.mjs` groups the staged paths by owning workspace and
      runs eslint once per group from that directory. Verified directly: the
      same file that failed from the root passes from `templates/vue-app/`, and
      the hook now prints one `eslint (<workspace>/)` line per group and passes.
      `createLefthookConfig()` is deliberately unchanged - a single-project
      consumer has no workspaces and can keep running eslint from its root - and
      `lefthook.yml` records why the two differ.

- [x] Released and published everything the repo was holding unreleased:
      `@busirocket/quality-config@0.2.0` (the `createKnipConfig` behavior change
      from this same session - a consumer that adopts it now fails on a dead
      entry-file export, which is a ratchet, not a patch),
      `@busirocket/prettier-config@0.1.2` and `@busirocket/tsconfig@0.2.1`
      (metadata only: their published tarballs predated the commits that pointed
      `repository`/`homepage`/`bugs` at this monorepo, so npm still linked the
      retired standalone `BusiRocket/prettier-config` repo), and
      `@busirocket/create-baseline@0.3.1` (its pins are derived from those
      versions). Published in dependency order through `publish.yml`, four
      successful runs (30809357438, 30809414554, 30809464477, 30809523862).
      `create-baseline` showed the propagation lag documented earlier in this
      log - `npm view` reported 0.3.0 for a moment after a successful run - and
      settled on 0.3.1. Also pushed the three backfilled tags plus the four new
      ones. Evidence: `pnpm release:check` exit 0 with all six packages at their
      published versions, CI green on the release commit (run 30809332981), and
      `pnpm audit --audit-level=high` exit 0.

- [x] Built the release-integrity gate the "a release is not done when the
      version is bumped" entry asked for, and closed the drift it found.
      `pnpm release:check` (`scripts/release-check.mjs`) checks every
      non-private package in `packages/*` for three things: a git tag
      `<unscoped-name>@<version>`, that exact version on the npm registry, and a
      `## <version>` heading in the package's `CHANGELOG.md`. Deliberately kept
      out of `check:ci`: it needs the network, and the commit that bumps a
      version legitimately precedes both its tag and its publish, so wiring it
      into CI would fail every release commit by construction. First run failed
      on three packages nobody had noticed: `@busirocket/eslint-config@0.5.0`,
      `@busirocket/prettier-config@0.1.1` and `@busirocket/tsconfig@0.2.0` each
      had no tag and no CHANGELOG at all - the same failure as the original
      entry, three times over. npm itself was clean: all six packages' published
      versions match source. Closed by writing the three missing changelogs
      (reconstructed from git history, each entry naming the commit that
      introduced the version, with pre-monorepo releases marked as such rather
      than invented) and creating three annotated tags at the commit that bumped
      each version - `ee83404`, `84ecc6f`, and for prettier-config `2acff2e`,
      the first commit in this repository carrying 0.1.1 since the published
      release predates the monorepo migration. Evidence: `pnpm release:check`
      went from exit 1 with three FAIL blocks to exit 0 with
      `6 packages fully released`. `pnpm check:ci` exit 0, `pnpm check:quality`
      exit 0. The tags are local; pushing them is tracked in `TODO.md`.

- [x] Turned `includeEntryExports` on for the per-template knip configs, which
      Task 8 had left off by evidence. Both blockers named in that entry are
      gone. `vue-app`'s false positive on `mountApp` was fixed at the source:
      `src/main.ts` now imports `@/app/index` explicitly instead of relying on
      knip resolving the path-aliased bare `@/app` to the directory's
      `index.ts`, so `src/app/index.ts` no longer has to be listed as an entry
      and the entry-to-entry import that knip refused to count as usage no
      longer exists. `nestjs-app`'s `bootstrap` is handled with
      `ignoreExportsUsedInFile: true`, which is the correct pairing with this
      repo's Primary Unit Rule: `code-policy/no-hidden-top-level-declarations`
      forbids a hidden top-level declaration, so an entry-point helper a file
      uses only itself still has to be exported. The narrower per-type form was
      tried first and does not work - knip's schema accepts only `class`,
      `enum`, `function`, `interface`, `member`, `type` and `variable`, and
      `export const bootstrap = async () => {}` matches none of them
      (`{ function: true, variable: true }` still reported it;
      `{ unknown: true }` is rejected as invalid input). The option only hides
      an export its own file already uses, so an export nothing references at
      all still fails. Coverage is real but partial, measured with a probe
      export rather than assumed: it now fails `nestjs-app` (`src/main.ts`) and
      `ts-package` (`src/index.ts`), where nothing caught a dead entry export
      before, and still does not fail `nextjs-app` (`app/page.tsx`),
      `vite-react-app` (`src/main.tsx`) or `vue-app` (`src/main.ts`) - knip's
      framework plugins register those files as entries of their own and the
      option does not reach them. Recorded in the config comment so the next
      reader does not re-derive it. Verified: all eight templates exit 0
      (`pnpm knip:templates`), probes removed, `pnpm check:ci` exit 0,
      `pnpm check:quality` exit 0.

- [x] Evaluated `isIncludeEntryExports` for the **root** `knip.config.ts` and
      left it off, now with the concrete list the old entry could only predict.
      `pnpm knip --include-entry-exports` at the root reports 17 unused exports
      and 4 unused exported types, and every one is a false positive of a
      different kind: `@busirocket/quality-config`'s public API
      (`createDepCruiserConfig`, `createKnipConfig`, `createLefthookConfig`,
      `TYPE_COVERAGE_THRESHOLD`, each reported twice - at its source file and at
      the barrel), the `default` export of all eight templates' `knip.config.ts`
      plus `nuxt-app/vitest.config.ts` (config files a tool loads, not a caller
      imports), `nestjs-app`'s `bootstrap`, and four generated types in
      `templates/nextjs-app/.next/types/routes.d.ts`. Suppressing that many real
      public exports to enable the flag would cost more than it buys, so the
      root config keeps the default. Revisit only if knip gains a
      per-entry-pattern override.

- [x] Moved the `eslint-config` / `eslint-plugin-code-policy` cyclic-dependency
      entry out of the backlog. It is not work: it is a standing constraint that
      already enforces itself, since reintroducing a bare
      `@busirocket/eslint-config` import in the plugin breaks the build with
      `Cyclic dependency detected: eslint-plugin-code-policy#build, @busirocket/eslint-config#build`.
      Recorded as "Decision 5 - the two ESLint packages must not declare a
      workspace cycle" in `docs/platform-decisions.md`, naming both real edges,
      why only one may be declared, and that the fix is restoring the relative
      import rather than adding the dependency.

- [x] Published `@busirocket/quality-config@0.1.0` (first ever release) and
      `@busirocket/create-baseline@0.3.0`. Hit and resolved the structural limit
      worth remembering: **`publish.yml`'s tokenless OIDC path cannot do the
      first publish of a new package name.** npm requires a package to already
      exist on the registry before a trusted publisher can be configured for it,
      so there is nothing to exchange the OIDC token against. Run 30805714749
      failed with
      `Skipped OIDC: ERR_PNPM_AUTH_TOKEN_EXCHANGE ... (status code 404)`, then
      pnpm fell back to `NODE_AUTH_TOKEN` - `setup-node`'s literal
      `XXXXX-XXXXX-XXXXX-XXXXX` placeholder - and npm answered
      `E404 PUT registry.npmjs.org/@busirocket%2fquality-config`. Unblocked with
      one authenticated `npm publish` of the package, after which the trusted
      publisher was configured (org `BusiRocket`, repo `baseline`, workflow
      `publish.yml`) and `create-baseline@0.3.0` published through the workflow
      normally. **Every future new package in this repo needs the same
      bootstrap.** A brand-new package also takes minutes to appear on the
      public read path, unevenly across CDN edges: `npm access` and the
      npmjs.com settings page showed it immediately while `npm view` and an
      authenticated `GET registry.npmjs.org/...` still returned 404 from some
      edges. That is propagation, not failure - ruled out staged publishing
      (`npm stage list` empty; staging is opt-in via `npm stage publish` and
      cannot apply to a new package) and private visibility
      (`npm access get status` returned `public`). Publish order was
      load-bearing and honored: `quality-config` first, because
      `create-baseline@0.3.0` pins `@busirocket/quality-config@^0.1.0` and
      `--check` now requires it. Verified against the real registry rather than
      the workflow log: `npx @busirocket/create-baseline@0.3.0 --soft` in a
      scratch project, then every pin it prints resolved with `npm view`.
- [x] Audited all five `pnpm-workspace.yaml` security overrides for whether they
      still do anything, which the entry asked for but nobody had run. Removed
      all five at once and reinstalled: `pnpm audit --audit-level=high` went
      from 0 high to 4 high, naming `tmp` (GHSA-ph9p-34f9-6g65), `sharp`
      (GHSA-f88m-g3jw-g9cj) and `postcss` (GHSA-6g55-p6wh-862q and
      GHSA-r28c-9q8g-f849). `fast-uri` (GHSA-v2hh-gcrm-f6hx, via astro's
      language server) and `brace-expansion` (GHSA-mh99-v99m-4gvg, via
      `eslint-plugin-import`'s `minimatch@3`) did **not** come back - both
      upstreams have moved past the patched version, so those two overrides were
      dead weight and are dropped. Restored the three that are still
      load-bearing and re-verified: `pnpm audit --audit-level=high` exit 0,
      `pnpm install --frozen-lockfile` clean, `pnpm check:ci` exit 0,
      `pnpm check:quality` exit 0. Lockfile churn is two deleted lines. Added a
      note above the remaining overrides recording that each is load-bearing and
      how to re-check, so the next pass does not have to rediscover the method.
- [x] `dependency-cruiser`'s single repo-wide `tsConfig` left three trees exempt
      from `no-orphans` by path pattern, so any _new_ dead file in
      `packages/eslint-plugin-code-policy/src/utils/`,
      `templates/vue-app/src/types|stores/` or `templates/nuxt-app/app/types/`
      passed silently. Implemented the per-workspace fix the entry called for:
      `pnpm deps:graph:aliased` (`scripts/deps-graph-aliased.mjs`) cruises each
      aliased workspace on its own, and the repo-wide run now excludes those
      three workspaces from `no-orphans` entirely rather than suppressing
      individual files - so the per-workspace run is their sole orphan authority
      and nothing new can slip in behind a stale path pattern. The repo-wide run
      keeps every rule that genuinely needs the whole graph (`no-circular`,
      `packages-must-not-depend-on-templates`, `no-dev-dep-in-production-code`,
      `no-deprecated-core`), via a new `scope: 'repo' | 'workspace'` option on
      `createDepCruiserConfig`. Two findings worth recording. First,
      **dependency-cruiser resolves a tsconfig's relative `paths` against the
      current working directory, not against the config file that declares
      them.** For vue-app and eslint-plugin-code-policy those are the same
      directory so it happens to work; for nuxt-app, whose paths live in the
      generated `.nuxt/tsconfig.json` and are written relative to `.nuxt/`,
      every aliased import still came back `couldNotResolve` even when passed
      `--ts-config .nuxt/tsconfig.json` directly. The runner therefore generates
      a `.baseline-depcruise.tsconfig.json` per workspace with those paths
      rebased to the workspace root, and removes it in a `finally` (gitignored
      in case a crash leaves one behind). Aliases are read from each workspace's
      own tsconfig by walking its `extends` chain, not restated in the runner,
      so a template that renames an alias cannot drift from what the gate
      resolves. Second, `enhancedResolveOptions.alias` is **not** in
      dependency-cruiser's config schema (it rejects the key as an additional
      property), so passing absolute aliases - the obvious way around the cwd
      quirk - is not available; that route was tried and abandoned. Verified the
      gate actually bites, which the old suppression could not: injecting a dead
      file into all three trees produced `error no-orphans` for each
      (`src/utils/deadProbe.ts`, `src/types/DeadProbe.ts`,
      `app/types/DeadProbe.ts`), and the probes were removed afterwards.
      Confirmed nuxt-app's cruise covers the full tree including `app.vue`,
      `pages/index.vue`, `.vue` components and `server/`, with zero
      `couldNotResolve`. `app.vue` and `pages/` remain exempt as genuine Nuxt
      file-convention entry points, now via a segment-anchored pattern that
      works at either scope. `pnpm deps:graph` exit 0, `pnpm deps:graph:aliased`
      exit 0, `pnpm check:quality` exit 0, `pnpm check:ci` exit 0.
- [x] `templates/nuxt-app` failed `create-baseline --check --hard` on a missing
      `@busirocket/tsconfig` devDependency (reproduced: exit 1, the only one of
      the eight templates that failed). Took the framework-aware branch of the
      two options the entry named, because the other one is not honestly
      available: Nuxt generates `.nuxt/tsconfig.json` from `nuxt.config`'s
      typescript options and the template's `tsconfig.json` extends that, so the
      shared presets have no insertion point and re-adding the dependency would
      trip the knip unused-dependency gate exactly as it did in `d71e1dd`.
      `create-baseline` now drops `@busirocket/tsconfig` from the required list
      when the project's `tsconfig.json` extends a path inside a dot-directory -
      build output a framework regenerates, never an authored file that could
      extend a preset. Chose that shape over a hardcoded list of framework paths
      so it covers `.svelte-kit`, `.wxt` and friends without naming frameworks
      this repo does not ship. Verified with a scratch fixture that it does not
      over-fire: an authored `./tsconfig.base.json` still requires the package,
      a project with no `tsconfig.json` still requires it, a JSONC
      `tsconfig.json` (comments, unparseable as JSON) falls back to requiring it
      so an unreadable file never silently drops the requirement, and only the
      `./.nuxt/tsconfig.json` case is exempt. All eight templates now pass
      `create-baseline --check --hard`. Not done here:
      `@busirocket/create-baseline` is published at 0.2.1 and this is a behavior
      change, so it needs a release before consumers see it.
- [x] Lighthouse `NO_FCP` on `templates/vite-react-app` and
      `templates/tauri-app`. The earlier reading - "a property of those two
      templates" that headless Chrome could not measure - was wrong on both
      counts. Root cause: every template validates its environment at module
      load (`envSchema.parse(import.meta.env)` in `src/env.ts`), Vite inlines
      `VITE_*` at **build** time, and `.gitignore` ships only `.env.example`
      (`.env` and `.env.*` are ignored). So a build with no `.env` embedded
      `undefined`, `env.ts` threw before `createRoot`/`mountApp` ran, and the
      bundle painted nothing. Reproduced in a real browser (Playwright over a
      static server on `dist`): empty accessibility snapshot plus
      `ZodError: [{"expected":"string","path":["VITE_API_BASE_URL"]}]`. The same
      failure was present in `templates/vue-app`, which the old entry claimed
      measured correctly; `astro-site`, `nextjs-app` and `nuxt-app` painted only
      because they ship server-rendered markup, not because their env was valid.
      Fixed at the source rather than around the gate: new `baseline-env-init`
      bin in `@busirocket/quality-config` copies `.env.example` to `.env` when
      `.env` is absent (idempotent, no-op without an example, cross-platform),
      wired into `prepare` and `perf:check` for the six templates that ship an
      `.env.example`. Nothing new is committed - `.env` stays gitignored in
      every template, verified with `git check-ignore`. Deliberately not done:
      no `.env*` file was committed and no template `.gitignore` was relaxed,
      since a template's `.gitignore` is copied into every downstream project
      and un-ignoring an env file there would silently invite consumers to
      commit real API URLs in a public repo. Surfaced and fixed one adjacent
      gap: `.lighthouseci/` report output broke `my-nuxt-app#lint` (it lints
      `.`), so `**/.lighthouseci/**` joined the shared `globalIgnores` in
      `@busirocket/eslint-config`'s base config. `Performance budget` re-added
      to the `verify` job in `.github/workflows/ci.yml`. Verified:
      `pnpm perf:check` exit 0 with 14/14 turbo tasks (all six measurable
      templates, including the two that could not be measured before),
      `pnpm check:ci` exit 0, `pnpm check:quality` exit 0,
      `pnpm workflows:check` exit 0, and a post-fix browser snapshot of
      `vite-react-app`'s `dist` showing the real rendered content with zero
      console errors.
- [x] Root `pnpm knip` vs per-template `pnpm knip` disagreed about
      `vitest-environment-nuxt` (`templates/nuxt-app`). Task 8 declared the
      dependency in `templates/nuxt-app/package.json` because
      `app/components/TheCounter.test.ts`'s `// @vitest-environment nuxt` pragma
      genuinely needs it resolvable, and the per-template `knip.config.ts`
      correctly demanded that. The root `knip.config.ts` couldn't see that same
      usage — its `templates/nuxt-app` workspace override sets `vitest: false`
      to dodge a real `@nuxt/kit`/jiti crash in knip's vitest plugin — so it
      flagged the newly-declared dependency as unused, dropping root `pnpm knip`
      from exit 0 to exit 1. Reproduced the original crash by temporarily
      re-enabling the plugin: knip failed to load
      `templates/nuxt-app/vitest.config.ts`, unable to resolve `@nuxt/kit`,
      confirming `vitest: false` still has to stay. Resolved by adding
      `vitest-environment-nuxt` to a narrowly-scoped `ignoreDependencies` entry
      on the root config's `templates/nuxt-app` workspace override (alongside
      the existing `TEMPLATE_ESLINT_PEER_DEPENDENCIES`, with a comment
      explaining the dependency is real and only invisible because the vitest
      plugin is off there) rather than reverting the dependency or re-enabling
      the plugin. Verified: `pnpm knip` (root) exit 0,
      `pnpm -r --filter "./templates/*" knip` exit 0, `pnpm check:ci` exit 0.
- [x] `@busirocket/quality-config` was not a root `devDependency` (removed by
      Task 6 as genuinely unused at the time). Task 9 re-added it
      (`pnpm add -D -w @busirocket/quality-config@workspace:*`) and the new root
      `.dependency-cruiser.cjs` now consumes it via
      `jiti('@busirocket/quality-config/dependency-cruiser')`, giving it a real
      consumer. Because that load goes through a dynamic string argument rather
      than a static import, root `pnpm knip` still flagged it as unused; fixed
      with a scoped `ignoreDependencies` entry for the package on the `.`
      workspace in `knip.config.ts`, with a comment explaining why. Verified:
      `pnpm knip` (root) exit 0, `pnpm deps:graph` exit 0, `pnpm check:ci`
      exit 0.
- [x] `includeEntryExports` probe surfaced `bootstrap` in
      `templates/nestjs-app/src/main.ts` as an apparently-dead export. Attempted
      to drop the `export` keyword; `pnpm lint` then failed on
      `code-policy/no-hidden-top-level-declarations` (this repo's Primary Unit
      Rule, enforced via `eslint-plugin-code-policy`), which requires every
      top-level declaration to be exported so a file never carries a hidden
      internal helper. Reverted the drop. `bootstrap` is not dead code: it looks
      unused only because `src/main.ts` is a process entry point that nothing
      inside this monorepo imports as a module (same shape as
      `main.tsx`/`page.tsx` in the other templates) — the export exists to
      satisfy the template's own one-exported-unit-per-file convention, not to
      be consumed by an in-repo caller. No source change needed; documented in
      `TODO.md`'s `includeEntryExports` entry.

- [x] 2026-08-12 — **Adoption findings:** fixed the three gaps a consumer's
      adoption surfaced.
  - `tailwindcss/classnames-order` fought `prettier-plugin-tailwindcss`:
    `createTailwindConfig` now turns the rule off, with a comment explaining
    Prettier owns class ordering (same rationale style as the neighboring
    `no-custom-classname` comment).
  - Root-level config files failed the lefthook pre-commit lint with "was not
    found by the project service": `createBaseConfig` now sets
    `projectService: { allowDefaultProject: [...] }` covering
    `*.config.{ts,mjs,js}`, `eslint.config.ts` and `knip.config.ts` (globs
    capped well under typescript-eslint's 8-file match limit, none containing
    `**`). That alone traded one failure for another: the default compiler
    options behind `allowDefaultProject` don't carry the real tsconfig's module
    resolution, so a plain `import path from 'node:path'` in a config file came
    back an unresolved "error" type and `no-unsafe-*` misfired on every import —
    reproduced with a minimal probe file before touching the fix, confirming it
    wasn't specific to `@busirocket/eslint-config`'s own subpath exports. Fixed
    by adding a second config block scoped to the same globs that spreads
    `tseslint.configs.disableTypeChecked` after the typed rules block, which
    only turns off rules that require real type information. This repo's own
    root `eslint.config.ts` needed a second, repo-specific fix: `tsconfig.json`
    used to `include: ["eslint.config.ts"]` as an ad hoc workaround for this
    exact problem (added in `897675d`, before `allowDefaultProject` existed
    here), which now made the project service find the file through both paths
    at once — typescript-eslint rejects that outright ("was included by
    allowDefaultProject but also was found in the project service"). Emptied
    that `include` array with a comment pointing at the factory fix that
    replaces it.
  - The suppressions ratchet only freezes error-level violations while `lint`
    runs `--max-warnings 0`, so an adopting repo with warn-level debt can't go
    green without fixing all warnings up front or promoting rules to error.
    Documented in `docs/adoption/existing-repo.md` under a new subsection, with
    the concrete rule list that consumer had to promote
    (`code-policy/view-logic-separation`, `max-lines-per-function`,
    `max-params`, `max-depth`, `complexity`, `promise/prefer-await-to-then`,
    `promise/prefer-await-to-callbacks`, `react-refresh/only-export-components`,
    `react/no-array-index-key`, `sonarjs/no-duplicate-string`) and a note that
    the `tailwindcss/classnames-order` removal above makes that particular
    promotion historical.
  - Evidence: `packages/eslint-config` lints and type-checks clean; root
    `eslint.config.ts`/`knip.config.ts` and every template's
    `eslint.config.ts`/`knip.config.ts` lint with 0 errors (all previously
    failed with "was not found by the project service" on `knip.config.ts`, or
    would have on `eslint.config.ts` once this file's own root-tsconfig
    workaround was removed); `turbo run type-check lint:fix` across the whole
    monorepo shows only the pre-existing `tsc: command not found` failures from
    this environment's `@typescript/typescript6` alias (confirmed identical on
    an untouched `main` via `git stash`, so not a regression);
    `pnpm format:check` and `pnpm dupes` pass. `@busirocket/eslint-config`
    CHANGELOG gained an `Unreleased` entry for both fixes; no version bump (this
    repo bumps versions at release time, in a dedicated `chore(release)` commit,
    not alongside the fix).
