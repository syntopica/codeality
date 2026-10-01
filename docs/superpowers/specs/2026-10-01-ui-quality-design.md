# ui-quality: a design gate for rendered web UIs

Status: approved by the owner on 2026-10-01 ("sí, tu goal es construir todo y
arreglar esa página"). First real target: the TienesLaVibra admin inbox.

## Problem

AI-generated UIs ship defects a person sees at a glance and no gate catches:
text at 1.12:1 contrast in dark mode, a preview clipped mid-word, a list whose
second column starts at a different x on every row, a search box glued to the
header, a content column using 72% of the space it has, badges in a colour the
brand does not use. A bake-off on `/admin/inbox` on 2026-10-01 measured what
exists: axe-core finds the contrast (only when the run uses
`colorScheme: 'dark'`), Impeccable's `detect` finds the overflow but cannot log
in, and nothing finds the alignment, the width, the inset or the palette.

## Shape: three modes, two artifacts

| Mode       | What it does                                                                                                     | Artifact                                    | Cost              | Deterministic               |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------- | --------------------------- |
| `check`    | measurable defects only; exit code and baseline                                                                  | `@syntopica/ui-quality`, CLI `codeality-ui` | CPU, seconds      | yes                         |
| `review`   | `check` + an agent reading the screenshots against a rubric: improvements and what is missing; no edits          | `design-quality` skill                      | tokens, on demand | no; findings carry evidence |
| `redesign` | `review`, then applies changes; done only when `check` has no new finding and before/after screenshots are shown | `design-quality` skill                      | tokens, on demand | no; gated by `check`        |

The agent never re-measures what `check` measures. It receives the report as
facts and spends its budget on judgement.

## The package

Lives at `packages/ui-quality` in this monorepo, built like `db-quality`: one
unit per file, `runCli` dispatching to commands, a fingerprinted baseline, exit
codes 0/1/2/3.

### Configuration: `codeality-ui.json`

```json
{
  "baseUrl": "https://example.com",
  "auth": {
    "loginPath": "/auth/login",
    "usernameEnv": "UI_QUALITY_USER",
    "passwordEnv": "UI_QUALITY_PASSWORD"
  },
  "routes": [{ "path": "/admin/inbox", "main": "main" }],
  "viewports": [
    { "width": 1440, "height": 900 },
    { "width": 390, "height": 844 }
  ],
  "colorSchemes": ["light", "dark"],
  "palette": { "variablePrefixes": ["--brand-"], "colors": ["#ffffff"] },
  "rules": { "content-width": { "minRatio": 0.8, "minViewport": 1280 } },
  "disable": [
    { "rule": "palette", "selector": ".third-party", "reason": "vendor widget" }
  ]
}
```

Credentials are read from the named environment variables, never from the file.
The session is cached in `.codeality-ui/state.json`; screenshots and the last
JSON report go to `.codeality-ui/` too, which `init` adds to `.gitignore`.

### Pipeline

1. **Capture** (Playwright, a peer dependency): log in once, then for every
   route x viewport x colour scheme load the page, wait for the network to go
   idle, screenshot it, run axe, and run one in-page probe that serialises what
   the rules need (visible elements with their box, computed colours, overflow,
   text-overflow, borders, the parent chain) into a plain `PageSnapshot`.
2. **Rules** are pure functions `PageSnapshot -> Finding[]`. They never touch a
   browser, so they are unit-tested on hand-built snapshots.
3. **Report**: findings sorted, fingerprinted on rule + route + scheme + element
   signature (never coordinates or viewport pixel values), then classified
   against the baseline.

### Rules in 0.1

| Rule             | Detects                                                                             | Source   |
| ---------------- | ----------------------------------------------------------------------------------- | -------- |
| `a11y/<axe-id>`  | every axe violation, contrast included                                              | axe-core |
| `text-clipped`   | text cut by an ancestor's overflow without an ellipsis                              | probe    |
| `row-misaligned` | in repeated sibling rows, the n-th child starting at different x                    | probe    |
| `control-inset`  | a bordered form control less than 4px from its container's visible edge             | probe    |
| `content-width`  | the main column using less than `minRatio` of the space it has, at wide viewports   | probe    |
| `palette`        | a visible text, background or border colour that is not in the palette (deltaE > 5) | probe    |
| `blank-route`    | the main region renders no text at all                                              | probe    |

### Commands

- `codeality-ui check [--json]`: capture, run the rules, print, exit 1 on
  findings (or on new findings when a baseline exists).
- `codeality-ui baseline create|update|check`: as in `codeality-db`.
- `codeality-ui init`: writes `codeality-ui.json` and the `.gitignore` entry.

## The skill

`design-quality`, authored at `~/p/agents/src/skills/core/design-quality/`.
Modes: `review` runs `codeality-ui check --json`, reads the screenshots in
`.codeality-ui/`, and reports in three groups (defects, improvements, missing
pieces), each item with its screen, element and why. `redesign` applies the
agreed changes, re-runs `check` until it adds no finding, and shows the
before/after screenshots. The rubric is ours; it borrows vocabulary from
better-ui, emil-design-eng, Impeccable and frontend-design without depending on
them.

## Acceptance

1. On the unfixed `/admin/inbox`, `codeality-ui check` reports the dark-mode
   contrast, the clipped preview, the misaligned sender column, the cramped
   search input, the narrow content column and the off-palette badge.
2. The package passes its own lint, type-check and tests at the workspace's
   coverage thresholds.
3. After the fix, `check` on `/admin/inbox` reports no finding, and the `review`
   mode's screenshots are shown to the owner.
