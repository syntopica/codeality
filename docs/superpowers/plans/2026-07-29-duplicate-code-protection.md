# Duplicate Code Protection (jscpd gate) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add jscpd v5 as a strict cross-file duplication gate to the baseline
monorepo, all 8 templates, and the create-baseline adoption flow.

**Architecture:** One `.jscpd.json` per scanned unit (repo root + each
template), a `dupes` script wired into every `check:ci`, a `dupes` turbo task,
and a third-party pin flowing through `sync-versions.mjs` into
`baseline-versions.json` so `create-baseline` recommends jscpd to adopting
repos. The one existing clone in `eslint-plugin-code-policy` is refactored away
so the 1% threshold has real margin.

**Tech Stack:** jscpd 5.0.14 (Rust engine), pnpm workspaces, turborepo, vitest.

**Spec:**
`docs/superpowers/specs/2026-07-29-duplicate-code-protection-design.md`

## Global Constraints

- Repo root: `/Users/cristiandeluxe/p/codeality`. Commit directly to `main`.
  English everywhere. No AI attribution in commits.
- jscpd version: `"jscpd": "^5.0.14"` — identical string in every package.json
  that gets it (root + 8 templates). `sync-versions.mjs` does NOT manage
  third-party deps; alignment is manual, so copy the exact string.
- `.jscpd.json` canonical content (identical everywhere unless a task says
  otherwise):

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

Erratum: `exitCode` was removed from the canonical config after this plan was
written. jscpd's `exitCode` overrides its default clone-threshold exit behavior
with a fixed code, so setting it to `1` fails the gate on any clone found
regardless of the configured threshold; the gate must stay threshold-driven
instead.

- Strict repo: no threshold bumps, no ignores added to make a check pass. If a
  check fails, fix the cause.
- After each task, run the named verification command before committing.
  Prettier formats JSON: run `pnpm format` scoped to new files if `format:check`
  complains.

---

### Task 1: Commit pre-existing working-tree changes

The working tree already carries an unfinished version-bump pass (packageManager
11.5.0→11.15.0, dep bumps, lockfile, pnpm-workspace.yaml) across 14 files. It
must be committed first so the jscpd work stays atomic.

**Files:**

- Modify: none (commit what is already modified)

- [ ] **Step 1: Confirm the diff is only version bumps**

Run:
`git diff --stat && git diff -- package.json pnpm-workspace.yaml | head -80`
Expected: only version strings, dep ranges, lockfile, and workspace config
changes. No source-code logic changes. If anything else appears, STOP and
report.

- [ ] **Step 2: Verify install is consistent**

Run: `pnpm install --frozen-lockfile` Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml packages/*/package.json templates/*/package.json
git commit -m "chore: bump pnpm to 11.15.0 and align dependency ranges"
```

Run: `git status --short` — expected: clean (spec/plan docs already committed).

---

### Task 2: Root jscpd gate

**Files:**

- Create: `.jscpd.json` (repo root)
- Modify: `package.json` (repo root)
- Modify: `turbo.json`

**Interfaces:**

- Produces: root script `dupes` (scans `packages scripts`), turbo task `dupes`
  (later tasks add per-template `dupes` scripts that this task's turbo entry
  will run), `check:ci` runs both.

- [ ] **Step 1: Add devDependency**

Run: `pnpm add -D -w jscpd@^5.0.14`

- [ ] **Step 2: Create root `.jscpd.json`**

Exact canonical content from Global Constraints.

- [ ] **Step 3: Wire root scripts**

In root `package.json` scripts:

```json
"dupes": "jscpd packages scripts",
"check:all": "turbo run type-check lint:fix && pnpm format && pnpm dupes",
"check:ci": "pnpm sync-versions:check && turbo run type-check lint test build dupes && pnpm format:check && pnpm dupes"
```

(`check:all` and `check:ci` are the existing lines with the `dupes` additions;
keep the rest verbatim.)

- [ ] **Step 4: Add turbo task**

In `turbo.json` `tasks`, add:

```json
"dupes": {
  "inputs": ["src/**", "app/**", "*.jscpd.json", ".jscpd.json"]
}
```

- [ ] **Step 5: Verify gate passes on current code**

Run: `pnpm dupes` Expected: exit 0. One clone currently exists in
`eslint-plugin-code-policy` (removed in Task 3) but total duplication is ~0.5%,
under the 1% threshold.

- [ ] **Step 6: Verify gate trips on injected duplication**

```bash
cp packages/eslint-plugin-code-policy/src/utils/detect-file-kind.ts /tmp/dupe-probe.ts
cp /tmp/dupe-probe.ts scripts/dupe-probe.ts
pnpm dupes; echo "exit: $?"
rm scripts/dupe-probe.ts
```

Expected: non-zero exit while the probe file exists (clone + threshold
exceeded). If it exits 0 with the probe present, the gate is not working —
investigate `exitCode`/`threshold` wiring before proceeding.

- [ ] **Step 7: Commit**

```bash
git add .jscpd.json package.json pnpm-lock.yaml turbo.json
git commit -m "feat: jscpd cross-file duplication gate at repo root"
```

---

### Task 3: Refactor the existing clone in eslint-plugin-code-policy

jscpd found one clone: the exempt-filename guard duplicated between
`packages/eslint-plugin-code-policy/src/rules/atomic-file.ts:27-39` and
`packages/eslint-plugin-code-policy/src/rules/one-primary-unit.ts:27-41`. The
copies have already diverged (`one-primary-unit` also exempts `proxy.ts`) —
exactly the failure mode this project guards against. Extract the shared part.

**Files:**

- Create:
  `packages/eslint-plugin-code-policy/src/utils/is-exempt-entry-filename.ts`
- Create:
  `packages/eslint-plugin-code-policy/tests/is-exempt-entry-filename.test.ts`
- Modify: `packages/eslint-plugin-code-policy/src/rules/atomic-file.ts`
- Modify: `packages/eslint-plugin-code-policy/src/rules/one-primary-unit.ts`

**Interfaces:**

- Produces: `isExemptEntryFilename(filename: string): boolean` — true for config
  files (`.config.ts/.js/.mjs/.cjs`), declaration files (`.d.ts`), and index
  entrypoints (`index.ts/.tsx/.js`). Does NOT cover `proxy.ts`; that exemption
  is specific to `one-primary-unit` and stays local there.

- [ ] **Step 1: Write the failing test**

`packages/eslint-plugin-code-policy/tests/is-exempt-entry-filename.test.ts`
(match the describe/it style of the existing files in `tests/`):

```ts
import { describe, expect, it } from 'vitest'

import { isExemptEntryFilename } from '@/utils/is-exempt-entry-filename.js'

describe('isExemptEntryFilename', () => {
  it.each([
    'vite.config.ts',
    'eslint.config.js',
    'app.config.mjs',
    'tailwind.config.cjs',
    'globals.d.ts',
    'src/index.ts',
    'src/components/index.tsx',
    'lib/index.js',
  ])('returns true for %s', (filename) => {
    expect(isExemptEntryFilename(filename)).toBe(true)
  })

  it.each(['src/formatDate.ts', 'src/UserCard.tsx', 'proxy.ts', 'indexer.ts'])(
    'returns false for %s',
    (filename) => {
      expect(isExemptEntryFilename(filename)).toBe(false)
    },
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter eslint-plugin-code-policy test -- is-exempt-entry-filename`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the util**

`packages/eslint-plugin-code-policy/src/utils/is-exempt-entry-filename.ts` (one
export, comment style of the other utils):

```ts
// Filenames that legitimately hold multiple top-level declarations: tool
// config entrypoints, ambient declaration files, and slice index barrels.
// Shared by atomic-file and one-primary-unit so the exemption list cannot
// drift between the two rules again.
export function isExemptEntryFilename(filename: string): boolean {
  return (
    filename.endsWith('.config.ts') ||
    filename.endsWith('.config.js') ||
    filename.endsWith('.config.mjs') ||
    filename.endsWith('.config.cjs') ||
    filename.endsWith('.d.ts') ||
    filename.endsWith('index.ts') ||
    filename.endsWith('index.tsx') ||
    filename.endsWith('index.js')
  )
}
```

Note `indexer.ts` must stay false — `endsWith('index.ts')` does not match
`indexer.ts`, no extra handling needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter eslint-plugin-code-policy test -- is-exempt-entry-filename`
Expected: PASS.

- [ ] **Step 5: Use the util in both rules**

In `atomic-file.ts`, replace the whole
`if (filename.endsWith('.config.ts') || ... )` block with:

```ts
if (isExemptEntryFilename(filename)) {
  return {}
}
```

Add
`import { isExemptEntryFilename } from '@/utils/is-exempt-entry-filename.js'`
with the other imports.

In `one-primary-unit.ts`, same replacement but preserving its extra exemption:

```ts
if (
  isExemptEntryFilename(filename) ||
  filename.endsWith('proxy.ts') // Exempt explicit configuration or typings
) {
  return {}
}
```

- [ ] **Step 6: Full package check + clone gone**

Run:
`pnpm --filter eslint-plugin-code-policy test && pnpm --filter eslint-plugin-code-policy lint && pnpm --filter eslint-plugin-code-policy type-check`
Expected: all pass.

Run: `pnpm dupes` Expected: exit 0 and "Found 0 clones" for typescript
(yaml/json are not scanned).

- [ ] **Step 7: Commit**

```bash
git add packages/eslint-plugin-code-policy
git commit -m "refactor(code-policy): extract shared exempt-filename guard"
```

---

### Task 4: Wire the gate into all 8 templates

**Files (repeat for each template `T` in: astro-site, nestjs-app, nextjs-app,
nuxt-app, tauri-app, ts-package, vite-react-app, vue-app):**

- Create: `templates/T/.jscpd.json`
- Modify: `templates/T/package.json`

**Interfaces:**

- Consumes: turbo `dupes` task from Task 2 (templates are workspace members, so
  `turbo run dupes` picks them up once the script exists).

- [ ] **Step 1: Create `.jscpd.json` in each template**

Canonical content from Global Constraints in all 8. The `rust` format entry is
inert outside tauri-app; keeping the file identical everywhere beats
per-template variants.

- [ ] **Step 2: Add script + devDependency to each template package.json**

In `scripts`:

```json
"dupes": "jscpd ."
```

Append `&& pnpm dupes` to each template's existing `check:all` (where present)
and `check:ci` lines — e.g. nextjs-app becomes:

```json
"check:all": "pnpm type-check && pnpm lint && pnpm format:check && pnpm dupes",
"check:ci": "pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm dupes"
```

(Each template's existing line differs slightly — append, don't replace.)

In `devDependencies`: `"jscpd": "^5.0.14"` (keep alphabetical order).

- [ ] **Step 3: Install**

Run: `pnpm install` Expected: exits 0, lockfile updated.

- [ ] **Step 4: Run the gate across all templates**

Run: `pnpm turbo run dupes` Expected: `dupes` runs in all 8 templates +
workspace packages with the script; all exit 0. Template starter code must be
duplication-free — if any template fails, fix the starter code (do not touch the
threshold) and note it in the task report.

- [ ] **Step 5: Commit**

```bash
git add templates pnpm-lock.yaml
git commit -m "feat(templates): jscpd duplication gate in every template check"
```

---

### Task 5: create-baseline recommends jscpd

`sync-versions.mjs` derives `baseline-versions.json` from workspace package
versions only. Extend it with an explicit third-party pin block so adopting
repos get jscpd from `npx create-baseline`.

**Files:**

- Modify: `scripts/sync-versions.mjs`
- Modify: `packages/create-baseline/baseline-versions.json` (regenerated, not
  hand-edited)

**Interfaces:**

- Consumes: `renderBaselineVersions(versions)` in `scripts/sync-versions.mjs`
  builds the pins object from `BASELINE_CONSUMER_PACKAGES`.
- Produces: `baseline-versions.json` additionally containing
  `"jscpd": "^5.0.14"`; `create-baseline` needs no code change (it iterates the
  JSON keys).

- [ ] **Step 1: Add the pin constant**

In `scripts/sync-versions.mjs`, next to `BASELINE_CONSUMER_PACKAGES`:

```js
// Third-party tools the baseline mandates in consumer repos. Not derived from
// packages/* — bump deliberately, in lockstep with the version used by the
// templates.
const THIRD_PARTY_PINS = {
  jscpd: '^5.0.14',
}
```

In `renderBaselineVersions`, merge it into the returned pins after the workspace
loop:

```js
Object.assign(pins, THIRD_PARTY_PINS)
```

(Read the rest of the function first; keep its existing return/serialization
exactly as is.)

- [ ] **Step 2: Regenerate and check**

Run: `pnpm sync-versions && pnpm sync-versions:check` Expected: both exit 0;
`git diff packages/create-baseline/baseline-versions.json` shows the added
`"jscpd": "^5.0.14"` line and nothing else.

- [ ] **Step 3: Smoke-test create-baseline output**

Run:
`cd /tmp && node /Users/cristiandeluxe/p/codeality/packages/create-baseline/bin/create-baseline.mjs --soft; cd -`
Expected: the printed `pnpm add -D` line includes `jscpd@^5.0.14`.

- [ ] **Step 4: Commit**

```bash
git add scripts/sync-versions.mjs packages/create-baseline/baseline-versions.json
git commit -m "feat(create-baseline): pin jscpd for adopting repos"
```

---

### Task 6: Documentation

**Files:**

- Modify: `docs/standards/code-quality.md`
- Modify: `docs/standards/scripts.md`
- Modify: `docs/guides/rust-baseline-adoption.md`
- Modify:
  `docs/superpowers/specs/2026-07-29-duplicate-code-protection-design.md`

- [ ] **Step 1: code-quality.md — new section**

Add a `## Cross-file duplication (jscpd)` section after the existing sonarjs
rule docs (around line 230). Content to cover, in the file's existing voice:

- Why sonarjs is not enough: ESLint analyzes one file at a time;
  `no-identical-functions` only sees clones inside a single file. Cross-file
  copy-paste — the dominant AI failure mode — needs a whole-repo pass.
- The tool: jscpd v5 (token-based, Rust engine), config in `.jscpd.json`, run
  via `pnpm dupes`, wired into `check:ci`.
- The knobs and their rationale: `minTokens: 70` (below that, matches are
  boilerplate noise), `threshold: 1` (percent duplicated lines; strict because a
  healthy codebase sits at ~0), `format` restricted to code (YAML/JSON/Markdown
  duplication across configs is intentional), `gitignore: true`, tests scanned
  on purpose.
- The rule for failures: fix the duplication (extract a shared unit, per the
  Atomic File Rule). Raising `threshold` or adding an `ignore` entry is a
  documented, reviewed decision in the PR description — never a silent bump to
  get CI green.
- What jscpd cannot catch: semantic duplication (same logic, different tokens).
  Point to `sonarjs/no-identical-functions` for in-file cases and manual review
  for the rest.

- [ ] **Step 2: scripts.md — add `dupes` to the script inventory**

Add a `dupes` row/entry consistent with the file's format: `jscpd .` in
templates, `jscpd packages scripts` at the baseline root; part of `check:ci`.

- [ ] **Step 3: rust-baseline-adoption.md — duplication note**

Short section: for Rust repos, `cargo install jscpd` provides the same gate
without Node (`jscpd .` honors `.jscpd.json`; keep the canonical config).
Mention `cargo-dupes` and `similarity-rs` as optional AST-based audit tools
(deeper matching, noisier, not gates).

- [ ] **Step 4: Fix spec inaccuracies**

In the spec, correct two lines to match reality:

- create-baseline is an advisor that prints devDependencies (it does not
  scaffold/copy templates); jscpd reaches consumers via the
  `baseline-versions.json` pin.
- `sync-versions.mjs` aligns the pin via `THIRD_PARTY_PINS`, not by scanning
  package.jsons.

- [ ] **Step 5: Commit**

```bash
git add docs
git commit -m "docs: cross-file duplication standard and jscpd runbook notes"
```

---

### Task 7: Full verification

- [ ] **Step 1: Full CI gate**

Run: `pnpm check:ci` Expected: exits 0 end-to-end (sync-versions:check,
type-check, lint, test, build, dupes per workspace, format:check, root dupes).
Fix any fallout (likely: prettier formatting of new JSON files — run
`pnpm format` and re-run).

- [ ] **Step 2: End-to-end gate proof in a template**

```bash
cp templates/nextjs-app/src/lib/*.ts /tmp/probe.ts 2>/dev/null || cp templates/nextjs-app/app/page.tsx /tmp/probe-page.tsx
# duplicate any 70+-token template source file next to itself:
cp templates/nextjs-app/app/page.tsx templates/nextjs-app/app/probe-copy.tsx
pnpm --filter my-nextjs-app dupes; echo "exit: $?"
rm templates/nextjs-app/app/probe-copy.tsx
```

Expected: non-zero exit with the probe copy present. (If `page.tsx` is under 70
tokens, pick the largest file in the template's `src/` or `app/`.)

- [ ] **Step 3: Commit any verification fixes**

```bash
git status --short
git add -u && git commit -m "chore: formatting fallout from duplication gate wiring"
```

Only if there is fallout; otherwise skip.
