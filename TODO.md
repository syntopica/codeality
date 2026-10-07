# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Python baseline

- [ ] Second pass on the Python consumers' accepted backlog (after the
      2026-10-07 pass in TODO_LOG.md). Left: DJCenterDeluxe 114 findings (56 are
      `BPY006` inline SQL, a policy call atrium answered by switching the rule
      off) and the `holded_invoices_handler` ignore (strict path types change
      the Holded upload); djplayerdeluxe 51 and 29 ignored modules (hardware
      backends, the `utils` package needs a name); agent-deluxe 9 and 2 (its
      browser code calls browser-use 0.5.9 with arguments that version rejects,
      recorded in its TODO.md); qlctool 6; atrium 2. Each repo's TODO.md names
      the first step. Upgrade every consumer to codeality-py 0.2.5 with
      `uv lock --upgrade-package syntopica-codeality-py`; qlctool's
      `stage_x_positions.py` and agent-deluxe's `__main__.py` findings should
      then fall away.

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

- [ ] **Finish the estate adoption of `eslint-plugin-code-policy@0.8.0`**
      (2026-10-07; 20 of 26 done, see TODO_LOG.md). Left, each for a named
      reason: jobradar and ventanilla-unica (another session's uncommitted
      dependency update; retry when their trees are clean); contratica (its
      AGENTS.md keeps `eslint-suppressions.json` empty, 776 findings to fix by
      hand) and inpractise-demo (forbids suppressions, 85 findings); contratos
      236f696 committed but `Vibra-Lab/contratos` is archived, push refused;
      teapartydolls (merging deploys the client storefront; needs a PR the owner
      approves). Open PRs to merge once CI is green:
      pixel-potion/Mains.World#699, pixel-potion/PXPN.dev#266 (its merge deploys
      the Worker).

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

- [~] 45 more candidates, tiered by value and false-positive risk:
  `packages/ui-quality/docs/rule-candidates.md`. Tier 1 complete 2026-10-07.
  Smallest next step: `focus-invisible` (needs a keyboard pass in capture), then
  `touch-target`, `radius-sprawl` and `card-radius-admin` (reuse `isCard`).

## db-quality

- [ ] **Kysely type drift** (`kysely.databaseType`, spec section 3): deferred
      until a consumer has a live database in CI; the config key is reserved.

## Cross-project (filed 2026-09-09 from two consumer backlog runs)

## Routed from `~/p/TODO.md` (2026-10-03)

Moved verbatim from `~/p/TODO.md` on 2026-10-03; the routing table in
`~/p/TODO_LOG.md` (entry of that date) records each move.
