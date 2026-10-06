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

- [ ] **The nextjs template ships no `.baseline-advisories.json`, so a fresh
      consumer fails CI `check:security` on day one** (found 2026-09-30 in
      `~/p/compratuentrada`, run on `b4a8615`):
      `baseline-audit --level     moderate` reports 4 unwaived advisories, all
      through `@lhci/cli` - uuid GHSA-w5hq-g745-h8pq, tmp GHSA-ph9p-34f9-6g65,
      extract-zip GHSA-jmr9-qjv8-65gv and GHSA-7pqw-9j4j-h8q3 (no patched
      version). The repo root carries a waiver file for uuid but the template
      does not. Smallest next step: add the template's own
      `.baseline-advisories.json` and a `tmp` override, and make the template CI
      job run the audit so the gap shows here first.
- [ ] `@busirocket/eslint-config` 0.8.0 declares `@vitest/eslint-plugin` and
      `eslint-plugin-testing-library` as optional peers, but `code-quality.ts`
      composes `testing.ts` unconditionally, so every `/code-quality` consumer
      needs both or ESLint dies at config load with
      `Cannot find module '@vitest/eslint-plugin'`. Hit in `brain` on 2026-09-12
      by a routine dependency bump from 0.4.2: `pnpm install` was green, `lint`
      was red in both workspaces, and `pnpm peers check` had nothing to say
      because the peer is marked optional. The adoption guide already documents
      the pair as "easy to miss"; the package should say it too. Smallest step:
      drop `optional: true` for those two in `peerDependenciesMeta`, so the
      install warns instead of the lint crashing.

- [ ] `createNextjsConfig` enables `react/prop-types` through
      `react.configs.flat.recommended`, and the rule cannot see through
      `forwardRef`'s generic: every ref-forwarding primitive that destructures
      its props (`TableCell`, `Input`, shadcn's whole `ui/` folder) reports
      `'className' is missing in props validation`. In a TypeScript project the
      prop types are the validation, so adopters turn the rule off for
      `**/*.tsx` by hand (one consumer, 2026-09-08). Smallest step: the nextjs
      and vite-react layers set `react/prop-types: 'off'` for `.tsx` files
      themselves.

- [ ] **`check:ci` passes locally while CI `check:security` fails, because the
      audit is not part of `check:ci`.** Smallest next step: make the template's
      `check:ci` run `baseline-audit`, or document that the audit only runs in
      CI. Evidence: compratuentrada session transcript 2026-09-30.
- [ ] **The `create-baseline` README and template name the wrong plugin
      package.** `@syntopica/eslint-plugin-code-policy` returns 404 and the
      package resolves unscoped, so the template needs
      `eslint-plugin-code-policy`; pnpm 12 also needs `allowBuilds` rather than
      `onlyBuiltDependencies` in the templates. Smallest next step: fix the
      README and the template package names and the pnpm key. Evidence:
      compratuentrada task 1 report, `b4a8615`.
- [ ] **Test files are linted by the lefthook pre-commit but not by `check:ci`,
      so their errors only appear at commit time.** Smallest next step: add test
      files to the lint scope of the template's `check:ci`. Evidence:
      compratuentrada session transcript 2026-09-30.
- [~] **Knip prints hints on the nextjs template: `gitleaks` unlisted,
  `dependency-cruiser` redundant, and a `middleware` entry pattern that matches
  nothing.** Unclear whether the template still does this. Smallest next step:
  run `pnpm knip` on a fresh template install; if the hints remain, remove the
  `ignoreDependencies` placeholders and the dead entry pattern. Evidence:
  compratuentrada session transcript 2026-09-30.

## ui-quality

Rule candidates from the 2026-10-01 review of the TienesLaVibra admin inbox by
Codex and five design skills (impeccable, web-design-guidelines, ui-ux-pro-max,
better-ui, frontend-design). Shipped from that review: `edge-misaligned`,
`fixed-overflow`, `icon-contrast`, `raw-placeholder`, and `text-hard-cut`
reading nested rows and length spikes. Each item below names the probe fields it
needs.

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

- [ ] **The default `usernameSelector` fills a honeypot field.** 2026-10-06,
      Contratica: the login form starts with an off-screen spam-trap
      `<input type="text" name="companyWebsite">`. The default list
      `input[type=email], input[name=email], ..., input[type=text]` is one CSS
      selector, so `.first()` takes the first match in DOM order, not the first
      alternative: the honeypot got the email, login never navigated and the run
      died with `page.waitForURL: Timeout 30000ms exceeded` (exit 3). Smallest
      fix: in `src/capture/login.ts`, try each alternative in order and take the
      first visible match; add a fixture with a hidden text input first.

- [ ] **A consumer can gate only part of its site and nothing says so.**
      2026-10-03, TienesLaVibra: `codeality-ui.json` listed three `/admin`
      routes only, so the public card grid whose page 2 repeated page 1 (tied
      `ORDER BY` under `LIMIT/OFFSET`) shipped unseen. Adding 24 public routes
      surfaced 393 findings (192 palette, 48 nested-interactive, 30
      color-contrast, 9 console-error, 6 select-name, dark scheme with #111827
      on #0a0a0a), all fixed. Smallest step: have `check` read the site's
      `sitemap.xml` (or `init` propose routes from it) and warn once per route
      template with no configured route.
- [ ] **`console-error` cannot ignore a third-party frame.** 2026-10-03,
      TienesLaVibra: Cloudflare Turnstile logs "Permissions policy violation:
      picture-in-picture is not allowed" and "font-size:0;" from its own iframe,
      so `console-error` had to be disabled whole on four routes, hiding any
      real error there. Smallest step: let a `disable` entry take a `message`
      pattern, or skip messages whose source frame is cross-origin.
- [ ] **`auth` blocks a run of public routes.** 2026-10-03, TienesLaVibra: with
      `UI_QUALITY_USER` unset the run stops before the browser starts, even for
      routes that never reach `loginPath`, so the public pass needed a copied
      config without `auth` or `/admin` routes. Smallest step: a
      `--routes <glob>` filter, or measure routes that do not bounce and report
      the rest as `auth-skipped`.
- [ ] **`slow-request` flags fire-and-forget work.** 2026-10-03, TienesLaVibra
      artist pages: `trackRosterAccess`, a background view insert nothing on
      screen waits for, ran 2.5-4.7s on one screen per run and had to be
      disabled per route. Smallest step: a `disable` entry matching the request
      URL or server-action name, so the route keeps the rule.
- [ ] **Grid `pagination-broken` may misread a "next post" link.** 2026-10-03,
      b18a5c9: a main region with no table is paged through its largest repeated
      collection, and `rel="next"` or a "Siguiente" link counts as its pager. On
      an article page that link opens the next article, whose related-items list
      may match the first and fire. Unseen so far; checked live on
      tieneslavibra.com/categorias/artistas (12 cards, rel=next found, 0 overlap
      with page 2, no finding). Smallest step: require the next link's address
      to share the route's path prefix, or a numbered sibling.
- [ ] **`content-width` fires on reading and sign-in pages.** 2026-10-01,
      verticagtm: once its legal, auth and status pages gained a `<main>`, ten
      routes warned (legal prose at a 720px measure, a 448px sign-in card), all
      intended and kept with `disable` entries. The rule targets data pages.
      Smallest step: skip a main region with no table, grid or repeated row
      group, and test it on a prose fixture and a single-form fixture.
- [ ] **One failed navigation aborts the whole run.** 2026-10-01, a 66-route
      admin capture died at route 31 with
      `page.goto: net::ERR_ABORTED at     /admin/leads` (the dev server
      hot-reloaded mid-navigation) and exited 3 with no report for the 30 routes
      already captured. Smallest step: in `captureScreens`, retry a route once
      on `ERR_ABORTED`, then record it as a `capture-failed` finding and carry
      on, so exit 3 is kept for browser-level failures.
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
- [ ] **Dark runs duplicate light on class-themed apps.** 2026-10-01, every
      InteliFactu `*.dark.png` equals its light twin because the theme follows a
      stored preference, not `prefers-color-scheme`. Smallest step: detect
      identical light/dark captures and warn once, or let `colorSchemes` name a
      class or `localStorage` key to set.
- [ ] **Clipped text inside a `<select>` passes.** 2026-10-01, InteliFactu's
      Empresa select at 1920px cuts the descenders of "AJN Hostelería ESPJ ·
      E67686287" and `text-clipped` stays silent. Smallest step: compare a
      select's line-height plus padding against its content box height.
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
- [ ] Enable axe's `target-size` (WCAG 2.2 AA) and check whether the default
      AxeBuilder run already includes it.
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

- [ ] The files `codeality-db` writes (`codeality-db.json` from `init`,
      `.codeality-db-bench.json`, `db-quality/bench/README.md`) are
      `JSON.stringify` / hard-wrapped text that prettier reformats, so a
      consumer whose pre-commit runs `prettier --check` refuses the commit. Hit
      in verticagtm on 2026-09-26 adopting 0.2.0; worked around there by
      ignoring `.codeality-db-*.json` and formatting the config once. Next step:
      emit prettier-shaped JSON (short arrays inline) and unwrapped Markdown, or
      have `init` add the ignore line.
- [ ] `no-inline-types-in-runtime-files` misses anonymous type literals
      (`{ a: string }[]` in a `const` annotation); the 0.2.0 final review found
      two in `summarizeExplain.ts` that lint passed. Next step: extend the rule
      to `TSTypeLiteral` in annotations and assertions, with a test.
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
- [ ] `sqlite.queries` follow-ups from adopting 0.3.0 in Vexa (2026-09-29, 105
      findings baselined): (1) no way to exclude a subtree, so
      `sql/store/migrations` (8 findings, one-shot data migrations that may
      scan) is checked with the queries; add `exclude` globs. (2) `BDB404` fires
      on every guard, including `?2 IS NULL OR account_id = ?2` in a query whose
      other filter already seeks an index (`jobs_list.sql` after the fix); when
      `database` is set, drop a BDB404 whose statement plans without a full
      scan. Next step: both, with tests.
- [ ] `BDB406` reports an unfiltered whole-table statement as a missing index.
      Hit in Vexa on 2026-10-05 (fixed by baselining in Vexa `4a88be36`): five
      `clear_replayed_*.sql` files are a bare `DELETE FROM <table>` that empties
      the table on purpose, yet each got "full table scan ... give the filter an
      index it can use" although there is no filter and no index could help.
      `queryPlanFindings.ts` checks the plan for `SCAN` without looking at the
      statement. Next step: skip a `DELETE` or `UPDATE` with no `WHERE` (a
      deliberate whole-table operation), with a test for `DELETE FROM t`.

## Cross-project (filed 2026-09-09 from two consumer backlog runs)

- [ ] **knip 6.35 reports the default export of `vite.config.ts` as unused when
      the framework preset lists `vite.config.*` under `entry`.** The Vite
      plugin already treats that file as an entry whose exports are ignored;
      naming it again as a plain project entry now surfaces
      `Unused exports: default vite.config.ts`. A consumer hit it the day knip
      moved 6.34 -> 6.35.1 (2026-09-12) and worked around it by overriding
      `entry: ['src/main.{ts,tsx}']` in its `knip.config.ts`. Fix in
      `knip-framework.ts`: drop `vite.config.*` from the `tauri`, `vite-react`,
      `vite-vue` and TanStack presets, or mark it as an entry with exports
      ignored, then re-run the affected repos' `pnpm knip`.
- [ ] **commitlint's `type-enum` rejects `todo:`**, the subject every repo here
      uses for backlog commits (5 of one consumer's last 12). No sibling repo
      has wired the `commit-msg` hook yet, so the day one does, the standard
      blocks the convention estate-wide. Either add `todo` to the shared list or
      state that backlog commits use `docs(todo):`. Evidence: a consumer run
      2026-09-09, `@commitlint/cli` declared there with nothing running it (its
      single knip finding).
- [ ] **`@busirocket/eslint-config` pulls `@eslint/js@10.0.1`, whose peer is
      `eslint ^10`, against the installed `eslint 9.39.5`.** Pre-existing in a
      consumer's HEAD lockfile and warns on every install; decide whether the
      config moves to ESLint 10 or pins `@eslint/js` 9.
- [ ] **Adoption guide: the `vite-react` tsconfig's
      `noPropertyAccessFromIndexSignature` and the quality-config lint rules
      break `check:ci` on adoption in any repository written before them.** One
      consumer needed three commits (12 TS4111 in a Vite plugin directory, 41
      lint errors, knip on the Homebrew `gitleaks` binary and an unused
      `@commitlint/cli`) before a single backlog item could land; the 1352-error
      case in another is the same shape. Worth a documented first step (bracket
      access sweep, `.prettierignore` for `.serena/`, knip ignores) rather than
      a surprise per repo.

## Routed from `~/p/TODO.md` (2026-10-03)

Moved verbatim from `~/p/TODO.md` on 2026-10-03; the routing table in
`~/p/TODO_LOG.md` (entry of that date) records each move.

- [ ] **CI red on `main`.** Every push run on 2026-10-01 failed (latest 22:44
      UTC, `gh run list -R syntopica/codeality`); on 2026-09-28 the failing
      steps were `audit:check`, `check:ci` and `check:quality` (first seen
      2026-09-26). Split out of a cross-repo "Red CI" line in `~/p/TODO.md`.
