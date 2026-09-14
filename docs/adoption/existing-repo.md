# Adopting the baseline in an existing repository

## 1. Inventory

- List current ESLint entrypoints (`.eslintrc.*`, `eslint.config.*`,
  FlatCompat).
- **Count the workspaces that have NO config at all**, and how many files they
  hold. This is the number that decides the size of the job, and it is easy to
  miss: one adoption had a config in `apps/web` only, so five workspaces - about
  800 of 3,291 files - had never been linted by anything. Turning the baseline
  on there produced 1,118 findings that no `--suppress-all` decision had ever
  been taken about, on code nobody had reviewed against any rule.

  ```bash
  # Workspaces with no ESLint config of their own
  pnpm -r exec sh -c 'ls eslint.config.* .eslintrc.* >/dev/null 2>&1 || pwd'
  ```

  Budget those separately from the workspaces that are merely changing rule
  sets. A workspace moving from one config to another produces a diff; a
  workspace moving from nothing produces a backlog.

- Note Prettier version and plugins.
- Note TypeScript version and `tsconfig` extends chain.

## 2. Upgrade tooling

- Move to **ESLint 9+** and **flat config** before layering
  `@syntopica/eslint-config`. This may be the largest step; treat it as its own
  milestone.
- Align TypeScript to **5.4+** if you are below that.

## 3. Install baseline packages

```bash
pnpm add -D @syntopica/eslint-config@^0.1.0 @syntopica/prettier-config@^0.1.0 @syntopica/tsconfig@^0.1.0
```

Install the packages each ESLint subpath needs. `@syntopica/eslint-config` ships
TypeScript source rather than a build, so its `import` statements resolve from
your project: a plugin missing there fails `tsc --noEmit` with
`Cannot find module '<plugin>'` before ESLint runs, even when the plugin is a
`dependencies` entry of the config package. The per-subpath list is in the
[package README](https://github.com/BusiRocket/engineering-baseline/tree/main/packages/eslint-config#stacks).

Two that are easy to miss:

- `/code-quality` composes the testing layer unconditionally, so it needs
  `eslint-plugin-testing-library` and `@vitest/eslint-plugin` even in a repo
  with no tests.
- `/nextjs` and `/vite-react` need `eslint-plugin-boundaries`, pulled in by the
  frontend-boundaries layer they compose.

On **ESLint 10**, also check the React version the config reports. The newest
published `eslint-plugin-react` (7.37.5) crashes during its own version
detection with `contextOrFilename.getFilename is not a function`, so every file
fails before a rule runs. `createNextjsConfig` and `createViteReactConfig` avoid
that by resolving the React installed beside your project and handing the plugin
a concrete version; pass `reactVersion: '19.2.0'` explicitly if your React lives
somewhere their resolution cannot reach.

**Delete any local `settings: { react: { version: 'detect' } }` block while you
are there.** An ESLint 9 era config almost certainly has one - it was the
standard way to configure the plugin - and it reinstates the detection the
factories exist to avoid, so the crash comes back on a config that looks
correctly migrated. The symptom is the whole run failing at the first file with
`Error while loading rule 'react/display-name'`, not a rule reporting anything.

## 4. Migrate ESLint

1. Add a new `eslint.config.ts` that imports from `@syntopica/eslint-config` and
   matches your stack.
2. Run `pnpm exec eslint .` and fix or suppress issues in batches.
3. Remove old ESLint config files and `eslintConfig` fields from `package.json`
   when the new config is stable.

## 5. Prettier and TypeScript

Switch `prettier.config.*` to `@syntopica/prettier-config` variants. Update
`tsconfig.json` to extend `@syntopica/tsconfig/*` and resolve duplicate compiler
options. A multi-project repository keeps a solution-style root and puts the
presets on the leaves - the two shapes and the gate that depends on them are
documented in the
[`@syntopica/tsconfig` README](../../packages/tsconfig/README.md).

### What turning the strictness on actually costs

The honest number is reassuring, and its shape is predictable. Composing
`node.json` and `nextjs.json` onto a mid-sized production repository
(consumer-g, 2026-08) surfaced 33 pre-existing findings: 26 type errors from
`noUncheckedIndexedAccess`, and 7 ESLint errors the same narrowing exposed
(`restrict-template-expressions`, `no-unnecessary-condition`,
`no-unsafe-argument`). Every one of them was in `scripts/` and `e2e/`; `src/`
and `app/` came through clean. Application code that already passed review tends
to be fine - the debt pools in the tooling nobody reviews.

Two of the 33 were real bugs rather than missing narrowing, both the same shape:
`name in obj` used to validate a key. `in` accepts inherited prototype keys, so
`--arms=toString` passed an unknown-arm check. The fix is
`Object.hasOwn(obj, name)`, and the pattern is everywhere in CLI argument
handling - grep for `in ` guards over user input while you are there.

Two notes that follow:

- **The lint wave arrives WITH the tsconfig change, not after it.** The narrowed
  types are what expose the new ESLint findings, so adopt
  `@syntopica/eslint-config` and `@syntopica/tsconfig` in one pass rather than
  two - sequencing them separately just splits one red build into two.
- **Fix at the source, not at the report.** A verification script that falls
  back to `''` instead of failing loudly turns a real failure into a false pass,
  which is worse than the unchecked access was. When a finding points at a weak
  spot, strengthen the spot; do not append `?? ''` until the checker goes quiet.

## 6. CI

Do not hand-roll it. `create-baseline --write` writes
`.github/workflows/ci.yml`: four jobs, three commands (`check:ci`,
`check:quality`, `check:security`), every action pinned to a commit SHA. It
writes nothing if a workflow already runs `pnpm run check:ci`, and it refuses to
add a second pipeline beside unrelated workflows - it reports those instead, so
you add the three steps to the pipeline you have.

This is the step that was missing everywhere. Across seventeen adopting
repositories, eight had no workflow at all while carrying the full gate set as
npm scripts: pre-commit lints staged files and pre-push scans for secrets, so
type-check, tests, knip, jscpd, dependency-cruiser and type-coverage had no
automatic trigger anywhere.

Then make drift a failing build rather than a discovery:

```bash
pnpm exec create-baseline --check   # in CI
pnpm exec create-baseline --fix     # locally, to repair the mechanical half
```

`--check` asserts the gates are **wired**, not merely installed: the
`--max-warnings 0` flag, every gate reachable from what CI actually runs, a
workflow that fires on push, actions pinned to SHAs, coverage produced and
thresacme, lefthook installed into `.git/hooks`, and dependency ranges able to
resolve the pinned baseline. Waive a finding by id in `baseline.exceptions.json`
with a `reason` and an optional, enforced `expires`.

## 7. Yarn

Yarn is not a supported target for documentation or CI in this baseline. Prefer
pnpm or npm.

## 8. Quality gates (knip, dependency-cruiser, lefthook, Renovate, gitleaks)

Add these after ESLint/Prettier/TypeScript are stable. `create-baseline --write`
generates the wiring - `knip.config.ts`, `.dependency-cruiser.cjs`,
`lefthook.yml`, `renovate.json`, `.oxlintrc.json`, the CI workflow, and the
`check:*` scripts. Each gate, its threshold, and how to handle a false positive
are documented in [quality-gates.md](../standards/quality-gates.md) - read that
before tuning any of them.

**The gates that get dropped are the ones worth most.** Of seventeen adopters,
knip ran in seven, jscpd in six, dependency-cruiser in two and type-coverage in
two - while type-check, lint, format and test ran nearly everywhere. Those four
are exactly the findings a reviewer cannot see in a diff, and every one of them
was written into `package.json` by this tool with nothing calling it. That is
what `--check` now refuses to pass.

## Adopting on a codebase with existing violations

A large existing codebase will report thousands of violations on day one. Freeze
them instead of fixing them all up front, then let the count fall:

```bash
pnpm lint:suppress   # writes eslint-suppressions.json -- commit it
pnpm lint            # passes: existing violations are frozen, new ones fail
```

`eslint-suppressions.json` is committed deliberately: it is the shared baseline.

`lint` runs plain `eslint --max-warnings 0`. That alone is the ratchet: ESLint
checks the committed suppressions file for entries that no longer match a real
violation and fails with an explicit message when it finds one - so fixing real
debt makes its suppression stale and `lint` fails until the entry is removed
with `pnpm lint:prune`. The suppression count can therefore only go down.

Two commands must never end up inside `lint` itself:

- `--suppress-all` (the `lint:suppress` script) freezes the _current_ state.
  Re-running it to clear a failing `lint` re-freezes debt someone just paid off
  - never do that to get green.
- `--prune-suppressions` (the `lint:prune` script) looks like it belongs in the
  gate but does not: ESLint prunes the suppressions file to disk _before_ it
  evaluates whether any suppression is unused, so a `lint` run carrying that
  flag always sees a freshly emptied file and passes silently, every time.
  Putting it on the gate disables the gate. Keep it on `lint:prune`, run by a
  human after fixing debt, never on `lint`.

### The suppressions ratchet does not cover warn-level debt

`--suppress-all` only freezes rules reported at `error` severity. The baseline
ships several rules at `warn` on purpose - they are useful signal without being
blocking by default - but `lint` runs plain `eslint --max-warnings 0`, so every
warn-level violation still fails the gate on day one, suppressions file or not.
An adopting repo with existing warn-level debt has two options: fix every
warning up front, or promote the rules it cares about to `error` in its own
config, which both clears the immediate blocker and folds those rules into the
same suppress/prune ratchet as everything else (recommended - it also makes new
violations on those rules fail loud instead of silently piling up as warnings).

Rules an adopting repo typically needs to promote:

- `code-policy/view-logic-separation`
- `max-lines-per-function`
- `max-params`
- `max-depth`
- `complexity`
- `promise/prefer-await-to-then`
- `promise/prefer-await-to-callbacks`
- `react-refresh/only-export-components`
- `react/no-array-index-key`
- `sonarjs/no-duplicate-string`

`tailwindcss/classnames-order` used to belong on this list too: it fought
`prettier-plugin-tailwindcss` (the class sorter in
`@syntopica/prettier-config/frontend`), so a repo running both `lint` and
`format:check` could never pass both at once regardless of severity. The factory
now disables that rule in `createTailwindConfig` - Prettier owns class
ordering - so this is historical, not a promotion an adopting repo needs to make
itself.
