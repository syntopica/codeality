# Duplicate Code Protection — Design

Date: 2026-07-29
Status: approved (pending spec review)

## Problem

AI-assisted development produces cross-file duplication: new files that
re-implement logic that already exists instead of importing it. The baseline
already enforces within-file duplication via `eslint-plugin-sonarjs`
(`no-identical-functions`, `no-duplicated-branches`, `no-duplicate-string`),
but ESLint analyzes one file at a time, so clones spread across files are
invisible to it. Nothing in the baseline detects cross-file clones today.

## Decision

Adopt **jscpd v5** (Rust engine, token-based clone detector) as a CI gate in
every template and in the baseline monorepo itself.

### Why jscpd v5

- One tool covers every language the baseline ships: TypeScript, TSX, JS,
  Vue SFC, Astro, and Rust (tauri-app template).
- v5 is a Rust rewrite of the v4 CLI: same flags/config, fast enough to run
  on every CI pass (the calibration run over `packages/ scripts/` took ~20ms).
- Configurable gate: `threshold` (max duplicated %) plus non-zero exit code
  fails the build.
- Also installable without Node (`cargo install jscpd`) for pure-Rust repos.

### Rust-specific alternatives considered

- **cargo-dupes** — cargo subcommand, AST normalization (`foo(x)` == `bar(y)`).
  Deeper detection, Rust-only, noisier. Not a gate; mentioned in cargo-baseline
  docs as an optional audit tool.
- **similarity-rs / similarity-ts (mizchi/similarity)** — AST-based semantic
  similarity. Catches "same logic written differently", but too fuzzy for a
  hard CI gate. Documented as optional audit tooling only.
- **SonarQube/SonarCloud** — full platform, overdimensioned for templates.

## Configuration

One `.jscpd.json` at the baseline repo root and one per template:

```json
{
  "minTokens": 70,
  "threshold": 1,
  "format": ["typescript", "tsx", "javascript", "jsx", "vue", "astro", "rust"],
  "gitignore": true,
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/.output/**",
    "**/target/**",
    "**/coverage/**"
  ],
  "reporters": ["console"]
}
```

No `exitCode` key: jscpd's gate is threshold-driven, not exit-code-driven. An
earlier draft of this config set `"exitCode": 1`, which made the run fail on
any clone at all regardless of `threshold` - removed by ruling. With the
`exitCode` key absent, jscpd exits non-zero only when total duplicated lines
exceed `threshold` (1%); a clone below that total is reported but does not
fail the build.

Decisions baked in:

- **`format` restricted to code.** YAML/JSON/Markdown excluded: CI workflows
  and config files are intentionally near-identical across templates and would
  drown the signal (calibration: YAML measured 65% duplication by design,
  TypeScript 0.48% duplicated lines).
- **`minTokens: 70`**, not the default 50 — calibrated to suppress trivial
  false positives while catching real copy-paste blocks.
- **`threshold: 1`** — strict by design. Templates start at 0% duplication;
  the baseline repo measures 0.48% duplicated TS lines today, and its one
  existing clone gets refactored as part of this work so the margin is real.
- **Tests are scanned too.** AI duplicates test scaffolding as readily as
  production code; excluding `**/*.test.*` would hide half the problem.
- **No cross-template scan.** Each template is standalone; similarity between
  templates is intentional. The baseline root scans `packages/ scripts/` only;
  each template scans itself via its own script.

## Wiring

- `"dupes": "jscpd ."` script in each of the 8 templates; root script scans
  `packages scripts`.
- New `dupes` task in `turbo.json` (no `dependsOn`, cacheable on inputs).
- `dupes` added to `check:ci` in the root and in every template's own
  `check:ci`, so the gate runs both in the monorepo pipeline and in projects
  generated from the templates.
- `jscpd@^5` devDependency at root and in all 8 templates; `sync-versions.mjs`
  keeps the version aligned via a `THIRD_PARTY_PINS` entry (`jscpd: '^5.0.14'`),
  not by scanning workspace `package.json` files - jscpd isn't a workspace
  package, so there's no version to read off it.
- `create-baseline` is an advisor CLI: it does not scaffold or copy template
  files. It prints the recommended devDependencies to add, sourced from
  `baseline-versions.json`, which picks up the `jscpd` pin through the same
  `THIRD_PARTY_PINS` sync.

## Existing sonarjs rules

Unchanged. `no-duplicate-string` stays `warn` (repeated string literals are a
naming smell, not structural duplication; erroring on them punishes legitimate
i18n keys and test fixtures). The jscpd gate is additive, not a replacement.

## Documentation

- `docs/standards/code-quality.md`: new "Cross-file duplication (jscpd)"
  section — why sonarjs alone is insufficient, how to read the report, and the
  rule for raising a threshold (conscious, documented decision in the PR, never
  a silent bump to make CI pass).
- cargo-baseline adoption runbook: note recommending `cargo install jscpd` for
  Rust-only repos, with cargo-dupes/similarity-rs listed as optional deeper
  audits.

## Success criteria

- `pnpm check:ci` at the baseline root runs the `dupes` gate and passes.
- Each template's `check:ci` runs its own `dupes` gate and passes at 0%.
- Introducing a copy-pasted 70+-token block in a template makes `dupes` exit
  non-zero.
- `sync-versions:check` passes with the new dependency present everywhere.

## Out of scope

- Semantic (AST) duplication detection as a gate.
- SonarQube/SonarCloud integration.
- Retroactive adoption in existing downstream repos (covered by the existing
  adoption docs flow, not this change).
