# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Python baseline

- [ ] Work down the structural backlog left in five consumer repositories,
      measured 2026-09-17 with codeality-py 0.2.2: 194 accepted findings and 36
      mypy `ignore_errors` modules in the largest, then 64 and 51, 57 and 9, 26
      and 12, and atrium at 19 and 0. Every one reports `0 new`, so nothing is
      drifting; the debt is what adoption accepted. Coverage floors beside them:
      5%, 9%, 35%, atrium 54%, 78%. Each floor was measured and none may go
      down. brain, clips and syntopica are clear, as are the private consumers
      not listed here: their whole gate passes with an empty backlog. The five
      accepted starlette advisories in one of them still fall away when
      platformio 7 lands.

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
  `ncu -u`, `pnpm install`, `pnpm check:ci`.

## ui-quality

Rule candidates from the 2026-10-01 review of the TienesLaVibra admin inbox by
Codex and five design skills (impeccable, web-design-guidelines, ui-ux-pro-max,
better-ui, frontend-design). Shipped from that review: `edge-misaligned`,
`fixed-overflow`, `icon-contrast`, `raw-placeholder`, and `text-hard-cut`
reading nested rows and length spikes. Each item below names the probe fields it
needs.

- [x] **`ui-quality@0.2.0` published 2026-10-07** (run 37538934323). The two
      earlier runs failed with OIDC token exchange 404 because the package's
      trusted publisher on npmjs.com showed `Status: Expired`; it was deleted
      and recreated (syntopica/codeality, publish.yml, no environment) and is
      `Pending validation` until this first publish. An expired trusted
      publisher reads as a 404, not as an auth error.
- [x] **axe hangs forever on a sandboxed srcdoc iframe.** 2026-10-06, Vexa
      reader: `new AxeBuilder({ page }).analyze()` in `captureScreen.ts` has no
      timeout and no frame exclusion. On the email body frame (`srcdoc`,
      `sandbox` without `allow-scripts`) it never returns: the list-only page
      finished in 3.4 s, the same page with the reader open timed out at 40 s,
      and `.exclude('iframe')` finished at once. The first full run sat 10 min
      on one route and died with
      `browserContext.newPage: Target page, context     or browser has been closed`.
      Smallest fix: a config `axe.exclude` list (selectors) plus a per-screen
      timeout that records a finding instead of hanging; add a fixture page with
      a script-less sandboxed iframe. Done 2026-10-06: sandboxed frames without
      `allow-scripts` are always excluded, `axe.exclude` and `axe.timeoutMs`
      added; `tests/cli.desktop-shell.integration.test.ts` times out at 60 s
      without the exclusion and passes with it.

- [x] **`icon-contrast` composites over white when the page colour is on body.**
      2026-10-06, Vexa dark mode: the probe collects
      `document.body.querySelectorAll('*')`, so body's own dark
      `background-color` and gradient are never seen and translucent ancestors
      are blended over white. Reported 1.52:1 and 2.63:1; rendered pixels
      measure 5.9:1 and 5.4:1. Smallest fix: include `document.body` (and
      `html`) in the probe's backdrop chain in `assets/probe.js` / `backdropOf`,
      with a fixture whose dark background sits on body. Done 2026-10-06: the
      probe returns `rootBackgrounds` (html, body) and
      `backdropOf`/`imageBehind` use them;
      `tests/rules/iconContrastCanvas.test.ts`.

- [x] **No init-script hook to stub a desktop shell.** 2026-10-06, Vexa (Tauri):
      the frontend renders only with a `window.__TAURI_INTERNALS__` IPC stub,
      and the config has no way to inject one, so the run needed a separate Vite
      config prepending the stub via `transformIndexHtml`. Smallest step: a
      config `initScripts: [path]` passed to `context.addInitScript`. Done
      2026-10-06: `initScripts` in the config, run per context; covered by the
      desktop-shell integration test.

- [~] **Interaction states are never captured.** 2026-10-01, the TienesLaVibra
  phone menu opened onto a drawer with no links and every rule passed, because
  capture only sees the resting page. `routes[].click` now clicks selectors in
  order before measuring (`click-failed` when one matches nothing). Left: an
  `empty-dialog` rule, an open `[role=dialog]` or drawer with no link, button or
  input besides its own close control. 2026-10-03, TienesLaVibra public pages:
  colour defects seen in code but never measured because they only appear on
  interaction: sticky CTAs that show after scrolling, roster card buttons on
  hover, selected states in the budget form. Left as well: capture after a
  scroll, and `:hover`/`:focus`/ selected states of repeated controls.
- [ ] `placeholder-fit`: placeholder text wider than its input's text box by
      over 20% ("Buscar rosters, categ…" at 390px). Needs `placeholder` plus a
      canvas `measureText` with the computed font.
- [ ] `duplicate-nav-icon`: two navigation items drawing the same icon (Clientes
      and Contactos share one, as do Plantillas and Canales). Needs a hash of
      each svg's markup.
- [ ] `mixed-icon-family`: filled and outline icons in one repeated column (a
      Font Awesome WhatsApp glyph beside a Lucide envelope). Needs the svg's
      fill/stroke attributes.
- [ ] `oversized-list`: one list over N rows (200 conversations, a 13,161px
      page) with no pagination control after it.
- [ ] `ghost-elevation` and `transition-all`: border plus shadow on one card;
      `transition-property: all`. Need `boxShadow` and `transitionProperty`.
- [ ] 49 more candidates, tiered by value and false-positive risk, with exact
      triggers and sources (Impeccable's detector registry, Vercel Web Interface
      Guidelines, Krehel's better-* skills, WCAG 2.2, Carbon, the OpenAI GPT-5.5
      frontend prompt): `packages/ui-quality/docs/rule-candidates.md`. Smallest
      step: add the style fields the probe lacks (`fontSize`, `lineHeight`,
      `letterSpacing`, `fontWeight`, `fontVariantNumeric`, `textAlign`,
      `boxShadow`, `borderRadius`, padding) to `assets/probe.js`, which unlocks
      about 15 of them, then ship tier 1 (`numeric-alignment`,
      `undersized-text`, `type-scale-sprawl`, `tight-leading`, ...).

## db-quality

- [ ] **Kysely support** (filed 2026-09-30; first consumer is the new
      `~/p/compratuentrada` ticketing app, which chose Kysely for one schema
      over MySQL/MariaDB, PostgreSQL and SQLite). 0.3.0 detects Supabase,
      Prisma, Drizzle and SQLite only. Scope, mirroring `adapters/drizzle/`: (1)
      lint rules in an ESLint asset - `updateTable`/`deleteFrom` without
      `.where`, `sql.raw`/`sql.ref` with a non-literal argument; (2) compile the
      project's Kysely migrations to SQL per dialect with a compile-only Kysely
      and feed the existing squawk and SQLite rules, require a `down`, hash
      applied migrations; (3) optional audit: `kysely-codegen` against a live DB
      diffed with the hand-written `Database` interface. `eslint-plugin-kysely`
      1.0.7 exists but is single-maintainer, unreleased since 2025-04, ~1k
      downloads/month - do not wrap it. Design:
      `docs/superpowers/specs/2026-09-30-db-quality-kysely-design.md`. Smallest
      next step: its implementation plan. Add to it a cross-dialect rule
      `kysely.inline-references`: an inline column `.references()` compiles to a
      column-level `REFERENCES`, which MySQL 8.4 parses and silently ignores (no
      FK created); MariaDB and SQLite enforce it. Seen in compratuentrada
      f4ba7e2, caught only by the mysql:8.4 CI leg, fixed with a table-level
      `addForeignKeyConstraint` in 37d1c05.

- [ ] db-quality 0.4.0: make `perf diff` usable as a CI gate. It compares the
      window mean against the cumulative mean since the stats reset, so it
      measures production drift, not the commit: on 2026-09-26 a simulated
      verticagtm CI run with the password raised BDB901 on `flush_email_queue()`
      (17.11 to 37.33 ms, 52 calls) with no code change, after the 5 ms floor
      had already removed two cron false positives. The owner chose to keep perf
      local until this lands, so no database password is stored in GitHub. Next
      step: compare against the previous window (two snapshots, or a rolling
      reference the gate refreshes), then offer CI wiring that writes
      `supabase/.temp/pooler-url` from a secret, which the shipped workflow
      lacks (the file is gitignored, so the perf stage always skips in CI
      today).

## Cross-project (filed 2026-09-09 from two consumer backlog runs)

## Routed from `~/p/TODO.md` (2026-10-03)

Moved verbatim from `~/p/TODO.md` on 2026-10-03; the routing table in
`~/p/TODO_LOG.md` (entry of that date) records each move.
