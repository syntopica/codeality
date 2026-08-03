# Quality Gates Reference

One section per gate: what it detects, where it runs, its threshold, why that
threshold, and how to handle a false positive.

**Never lower a threshold to get green.** If a gate is red, the fix is to fix
the violation, suppress it deliberately (where a suppression mechanism exists),
or open a documented exception in `TODO.md` - never to loosen the gate itself.

## `--max-warnings 0`

**Detects:** any ESLint `warn`-level finding, not just errors. Without this
flag, `complexity`, `max-depth`, `max-params`, `max-lines-per-function`, and
`sonarjs/no-duplicate-string` are advisory only and never fail a build.

**Runs:** in every `lint` script, root and per package/template (for example
`eslint src --max-warnings 0`), and in the `lefthook` pre-commit hook.

**Threshold:** zero. There is no warning budget.

**Why:** a warning nobody is forced to look at is dead configuration. If a rule
is worth having, it is worth failing the build on.

**False positive:** if a rule is systematically wrong for a file's real purpose
(a config file, a generated file, a test fixture), scope it out with an ESLint
`files`/`ignores` override in the relevant `eslint.config.ts` layer, with a
comment explaining why. Do not drop `--max-warnings 0`.

## `import/no-cycle`

**Detects:** circular imports between modules, at full depth (no `maxDepth`
cap). An earlier version of this rule was capped at `maxDepth: 1`, which only
caught direct A -> B -> A cycles; the longer cycles that actually tangle a large
codebase (A -> B -> C -> A) passed silently.

**Runs:** as part of `pnpm lint` (ESLint, `packages/eslint-config/src/base.ts`),
per file, on every push and pre-commit.

**Threshold:** any cycle is an error (`ignoreExternal: true` - cycles that route
through `node_modules` don't count).

**Why:** modules that import each other cannot be reasoned about or tested in
isolation, and the cost of a cycle rises with the number of files it spans - a
cap at depth 1 defeats the purpose.

**False positive:** a real cycle is not a false positive; break it by extracting
the shared piece both sides depend on into a third module.

## jscpd (cross-file duplication)

**Detects:** duplicated code blocks (minimum 70 tokens) copy-pasted across
different files. This is different from ESLint's `sonarjs/no-duplicate-string`,
which flags a repeated string literal inside a single file; jscpd looks across
the whole tree.

**Runs:** `pnpm dupes` (`jscpd packages scripts` at the engineering-baseline
root; `jscpd .` in templates, over the whole generated project). Part of
`check:ci`; **not** run per-workspace through Turbo - the per-package `dupes`
task was deliberately dropped from `check:ci` because the root run is the only
one that is a genuine cross-file gate.

**Threshold:** `threshold: 1` (max 1% duplicated lines), configured in
`.jscpd.json`.

**Why 1%:** strict by design. Templates start at 0% duplication; the budget
exists for edge cases (near-duplicate boilerplate that isn't worth abstracting
yet), not as a de facto allowance.

**False positive:** a genuine coincidental match (two files independently
needing the same 70-token shape, e.g. import blocks) should be extracted into a
shared helper if that's practical. If extraction would create worse coupling
than the duplication itself, raise the threshold - but only as a conscious,
documented decision in the PR, never silently to make CI green.

## knip

**Detects:** four findings a reviewer cannot see in a diff - unused files,
unused exports (including exported types), declared dependencies nobody imports,
and imports of dependencies never declared in `package.json`.

**Runs:** `pnpm knip` at the repo root (`knip.config.ts`, understands pnpm
workspaces natively - dead code across `packages/*` is only visible with a
global view), and `pnpm -r --filter "./templates/*" knip` per template (each
template's own `knip.config.ts` imports `createKnipConfig` from
`@busirocket/quality-config/knip` with its own framework/entry glob).

**Threshold:** `error` for `files`, `dependencies`, `devDependencies`,
`unlisted`, `exports`, `types`, `duplicates`; `warn` for `binaries` and
`unresolved` (these two produce real false positives against Turbo and pnpm's
script indirection, which knip's static analysis cannot see through).

**Why these are errors and those two are warnings:** the six error-level
findings are unambiguous - a dead export or an undeclared import is never
correct. `binaries`/`unresolved` have a structural false-positive source (Turbo
task graphs, pnpm's nested `node_modules`) that would make the gate cry wolf.

**Known gap - entry-file exports are not checked.** `includeEntryExports` is
deliberately off. `packages/*` publish one file per advertised sub-export
(`eslint-config/src/base.ts`, `quality-config/src/knip.ts`, and so on) rather
than a single barrel, so every top-level file in a package's `src/` is treated
as an entry point; knip does not flag exports of entry files as dead by default.
This is correct for a published library's public API (nothing inside this
monorepo consumes `createKnipConfig` the same way an external project will), but
it means a genuinely dead export added to one of those files will not be caught;
only additions to non-entry files (e.g. `src/rules/`, `src/utils/` inside
`eslint-plugin-code-policy`) are covered. See `TODO.md` for the investigation
into turning `includeEntryExports` on and why it isn't yet (it also flags real,
not-yet-consumed public API, and surfaces a `vue-app` template false positive
that needs a template-source fix first).

**False positive:** a dependency imported only through a dynamic string
(`jiti('@busirocket/quality-config/dependency-cruiser')`) or only by a peer
consumer (a template's ESLint peer dependencies, imported by
`@busirocket/eslint-config` itself, never by the template's own source) needs
`ignoreDependencies` in the relevant workspace's `knip.config.ts`, with a
comment explaining why knip can't see the real caller. Do not disable the
`dependencies`/`unlisted` rule to silence it.

## dependency-cruiser

**Detects:** graph-level architecture violations that ESLint's per-file
`import/no-cycle` cannot see across package boundaries: full-depth import
cycles, orphan modules (nothing imports them and they're not a recognized entry
point), `packages/*` importing from `templates/*` (inverting the scaffolding
relationship), a devDependency imported from production code, and imports of
deprecated Node core modules.

**Runs:** two passes, both folded into `check:quality`.

- `pnpm deps:graph` (`depcruise packages templates scripts`) at the repo root,
  for every rule that needs the whole graph. A cycle or a `packages/` ->
  `templates/` edge can span two workspaces, and `no-dev-dep-in-production-code`
  matches on a repo-relative path prefix, so none of these can be split up.
- `pnpm deps:graph:aliased` (`scripts/deps-graph-aliased.mjs`), one cruise per
  workspace that maps a path alias through its own tsconfig `paths` -
  `eslint-plugin-code-policy` and `templates/vue-app` (`@/*`),
  `templates/nuxt-app` (`~/*`). This pass owns `no-orphans` for those three, and
  the repo-wide pass excludes them from that rule entirely.

**Threshold:** `error` on `no-circular`, `no-orphans`, and
`packages-must-not-depend-on-templates`; `warn` on
`no-dev-dep-in-production-code`; `error` on `no-deprecated-core`.

**Why two passes:** dependency-cruiser takes a single `tsConfig` for a whole
cruise. One workspace's alias mapping is wrong for every other workspace - `@/*`
means `eslint-plugin-code-policy/src` in one place and `vue-app/src` in
another - so pointing the repo-wide run at any one tsconfig would produce wrong
edges rather than no edges. Splitting the orphan check per workspace is the only
way to resolve each mapping correctly.

This replaced an earlier `pathNot` list that suppressed the individual files
then known to be affected. That approach silently exempted any _new_ dead file
added to the same directories; whole-workspace exclusion plus a real
per-workspace check does not.

**Gotcha - `paths` resolve against the cwd.** dependency-cruiser resolves a
tsconfig's relative `paths` against the current working directory, not against
the config file that declares them. Where a workspace declares its aliases in
its own root tsconfig the two coincide and it works; Nuxt declares them in the
generated `.nuxt/tsconfig.json` relative to `.nuxt/`, so every aliased import
came back `couldNotResolve` even when `--ts-config .nuxt/tsconfig.json` was
passed directly. `scripts/deps-graph-aliased.mjs` therefore generates a
`.baseline-depcruise.tsconfig.json` per workspace with the paths rebased to the
workspace root, and removes it again afterwards. It reads those paths by walking
the workspace's own `extends` chain rather than restating them, so a renamed
alias cannot drift from what the gate resolves. `enhancedResolveOptions.alias`
is not an option here: it is not in dependency-cruiser's config schema
(`must NOT have additional properties`).

**False positive:** a file that is loaded by filename convention rather than by
import (a framework config file, a Next.js special file, a Nuxt
`app.vue`/`pages/` file, an ESLint rule-tester fixture) is excluded with a
`pathNot` regex on the `no-orphans` rule, with a comment recording how it was
verified (`depcruise --output-type json`) - never by turning the rule off.

## type-coverage - dropped, not a gate

**Status: not used.** `type-coverage-core` throws
`TypeError: Cannot read properties of undefined (reading 'Unknown')` while
reading `ts.SyntaxKind.Unknown` at load time - it cannot load the TypeScript
module behind this repo's `npm:@typescript/typescript6` alias. The failure is in
module loading, not in analysis, so no configuration change fixes it.

**Consequences:** there is no `types:coverage` script, no Turbo task, and
`type-coverage` is not in `THIRD_PARTY_PINS` inside
`packages/create-baseline/baseline-versions.json`. `check:quality` does not
include it. The type-safety ratchet in this repo is carried by the ESLint
bulk-suppressions mechanism alone (see below), which was always the load-bearing
half.

**Unblock condition:** retry once the repo moves off the
`@typescript/typescript6` alias to a released TypeScript 6, or evaluate
`tsc --noEmit --strict` plus a custom `as`-cast counter as a substitute. Both
are recorded in `TODO.md`; do not re-add `type-coverage` to a project without
first confirming it loads against that project's TypeScript setup.

**Residue worth knowing about:** `packages/quality-config` still ships a live
`./type-coverage` export (`TYPE_COVERAGE_THRESHOLD = 99` in
`src/type-coverage.ts`) and still names "type-coverage" in its package
`description`, even though nothing imports that export and the gate does not run
anywhere. A reader who finds the export or the description text alone could
reasonably conclude the gate exists; it doesn't. This is documented debt, not
something this task removes -- see the status note above for why the export is
dormant rather than deleted.

## ESLint suppressions ratchet

**Detects:** new lint violations against a frozen baseline, on a codebase that
had pre-existing debt at adoption time. The gate is `lint` itself - plain
`eslint --max-warnings 0` already fails with an explicit message when a
suppression recorded in `eslint-suppressions.json` is no longer needed (the
violation it names doesn't occur anymore).

**Runs:** three separate scripts, each with a distinct role:

- `lint` - `eslint src --max-warnings 0`. The gate. Checks new code against the
  rules and checks the committed `eslint-suppressions.json` for staleness.
- `lint:suppress` - `eslint src --suppress-all`. Freezes every current violation
  into `eslint-suppressions.json`. Run once, when adopting on an existing
  codebase with debt.
- `lint:prune` - `eslint src --prune-suppressions`. The cleanup command a human
  runs after fixing real debt, to remove the now-stale suppression entries from
  the file.

**Threshold:** the suppression count in the committed
`eslint-suppressions.json`. It can only go down - see the trap below for why.

**The trap: do not put `--prune-suppressions` inside `lint`.** This looked like
the natural way to wire the ratchet and was tried first in this repo's own
history. It silently disables the gate: ESLint writes the pruned suppressions
file to disk _before_ it evaluates whether any suppression is unused, so a
`lint` run with `--prune-suppressions` always sees a freshly-emptied file and
passes - every time, regardless of whether new debt was introduced. The
suppression count could grow forever and the gate would never turn red.
`--prune-suppressions` is a cleanup command, not a check; keep it on
`lint:prune` only, and keep `lint` at `--max-warnings 0`.

**Why this instead of betterer:** the original design considered
[betterer](https://github.com/phenomnomnominal/betterer) for the freeze/ratchet
pattern. It's unmaintained (latest is a 2024-12-01 alpha) and its stable line
predates ESLint flat config. ESLint 10.8.0 ships the same capability natively.

**False positive:** none in the usual sense - a suppression going stale means
the underlying violation is gone, which is the success case, not a failure to
handle. If `lint:suppress` is run again to "fix" a red `lint`, that re-freezes
debt someone already paid off; never do that to clear a failure.

## vitest / testing-library rules

**Detects:** defects a green test run doesn't surface - a committed `.only` that
silently skips the rest of the suite (`vitest/no-focused-tests`), a test with no
assertion (`vitest/expect-expect`), duplicate test titles
(`vitest/no-identical-title`), conditional `expect` calls
(`vitest/no-conditional-expect`), and Testing Library queries whose promises are
never awaited (`testing-library/await-async-queries`, `await-async-utils`).

**Runs:** as an ESLint layer (`createTestingConfig`, folded into
`createCodeQualityConfig` in `@busirocket/eslint-config`) matched against
`**/*.{test,spec}.{ts,tsx}`, `**/__tests__/**`, `**/test/**`. Every template
inherits it automatically through the shared `code-quality` layer - there is no
separate script to wire.

**Threshold:** `error` on the rules listed above, plus
`testing-library/no-container` and `prefer-screen-queries`; `warn` on
`vitest/no-disabled-tests` and `testing-library/no-node-access` (a deliberately
`.skip`'d test, or a rare direct DOM assertion, isn't always wrong the way a
focused test or an unawaited query is).

**Why:** `eslint-plugin-vitest` is deprecated; `@vitest/eslint-plugin` is its
maintained successor and is what this repo uses.

**False positive:** `no-node-access` is the one likely to fire on legitimate
code (asserting on a DOM node property Testing Library doesn't expose a query
for). Add a narrow, commented `eslint-disable-next-line` at the call site rather
than turning the rule off repo-wide.

## gitleaks

**Detects:** committed secrets by regex + entropy against gitleaks' default
ruleset (`useDefault = true` in `.gitleaks.toml`), plus two allowlist entries
for `pnpm-lock.yaml` and `Cargo.lock` (their integrity hashes read as
high-entropy strings but cannot hold a live credential).

**Runs:** in CI (`security` job, `gitleaks/gitleaks-action@v2`, full git history
via `fetch-depth: 0` - a shallow clone cannot see a secret committed three
commits ago), and locally in the `lefthook` `pre-push` hook
(`gitleaks detect --no-banner --redact`, working-tree scan).

**Threshold:** any finding fails. There is no severity tiering.

**Known limit, verified directly (gitleaks 8.30.1):** gitleaks does **not**
reliably catch a bare secret with no surrounding context. A file containing only
a 40-character AWS secret access key value (no `aws_secret_access_key =` prefix,
no other context) produces **zero findings** - confirmed by testing it directly.
The same value with a recognizable variable-name prefix _is_ caught, by the
generic high-entropy rule, not an AWS-specific one. By contrast, an AWS access
key ID (`AKIA...`, 20 chars) and vendor tokens with a distinctive prefix and
length (a GitHub PAT, `ghp_` + 36 chars) _are_ detected reliably on their own,
because their rules match a fixed prefix rather than relying on entropy plus
context. **Do not treat a clean gitleaks run as proof a file has no secrets in
it** - it's a net with a real hole in it, not a guarantee. Build output is
deliberately not exempted from the scan for the same reason: a bundler `define`
or a `NEXT_PUBLIC_*` value can bake a real secret into a generated artifact.

**False positive:** a real non-secret that matches (a lockfile hash, a test
fixture that looks like a token) goes into `[allowlist] paths` in
`.gitleaks.toml` with a comment justifying it. Never add `dist/`, `coverage/`,
or `target/` wholesale to the allowlist - that's exactly the built-output class
the config deliberately does not exempt.

## `pnpm audit`

**Detects:** known vulnerabilities in resolved dependencies (direct and
transitive), against the npm advisory database.

**Runs:** `pnpm audit --audit-level=high` (`audit:check` script), in the
`security` CI job.

**Threshold:** `--audit-level=high` - fails only on high and critical
advisories. A moderate advisory in a devDependency does not block the team.

**Why:** high/critical is the bar where "known, exploitable, unresolved" is
worth stopping a merge over; moderate-and-below findings in transitive
devDependencies are common enough, and often already accepted-risk enough, that
gating on them produces alert fatigue rather than action.

**False positive / stopgap handling:** when `pnpm dedupe` doesn't clear a
finding because the fix requires a transitive bump the parent package hasn't
shipped yet, pin the range forward with a scoped `pnpm-workspace.yaml`
`overrides` entry - never a blanket downgrade of the audit level. This repo
currently carries five such overrides (`tmp`, `fast-uri`, `sharp`, `postcss`,
`brace-expansion`), each commented with its advisory ID and the upstream
dependency chain, and tracked in `TODO.md` as removable once that chain's own
floor moves past the patched version.

## actionlint

**Detects:** invalid GitHub Actions workflow syntax - bad `runs-on` values,
undefined expression contexts, shellcheck-style issues inside `run:` blocks.

**Runs:** `actionlint` (`workflows:check` script) locally, repo root only -
workflows only exist at the root of a repo, never per package. In CI, the
`security` job runs the equivalent `raven-actions/actionlint@v2` action directly
rather than the `workflows:check` script; both run the same tool against the
same workflow files.

**Threshold:** any finding fails.

**Why:** a broken workflow file only announces itself when a push or PR triggers
CI and the job fails to even start; linting it locally and in CI catches that
before it reaches a real run.

**False positive:** actionlint occasionally doesn't know about a newer action
input; pin the action version precisely and, if the false positive persists,
suppress the specific line with an actionlint `# actionlint-ignore` comment
naming the rule, not by removing the check from CI.

## publint / attw

**Detects:** broken package `exports` maps, incorrect `main`/`types` fields, and
CJS/ESM resolution mismatches that only surface for a consumer, never in the
publishing repo's own tests - `publint` checks the packaged output against npm
packaging conventions; `@arethetypeswrong/cli` (`attw`) simulates how TypeScript
resolves the package's types under different `moduleResolution` settings.

**Runs:** `publish:check`
(`publint --strict && attw --pack . --profile node16`), only in the six
published packages under `packages/*` (`eslint-config`, `prettier-config`,
`tsconfig`, `quality-config`, `create-baseline`, `eslint-plugin-code-policy`) -
templates are `private: true` and never published, so the check doesn't apply to
them. `cargo-baseline` is the seventh package under `packages/*` and is
correctly excluded: it's a Rust crate, not an npm package.

**Threshold:** any `publint --strict` finding, or any `attw` finding not
explicitly ignored, fails.

**Why `--profile node16`:** matches the oldest resolution behavior these
packages commit to supporting; a package that resolves under `node16` also
resolves under every newer `moduleResolution` mode.

**Known, accepted ignores:** `eslint-config` and `quality-config` run
`attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm internal-resolution-error`.
Both packages export raw TypeScript source with no build step, loaded by
consumers via `jiti`/ESM, never `require()` - so `cjs-resolves-to-esm` is
expected, not a defect. `internal-resolution-error` fires because `attw`'s
sandbox only contains the package's own tarball, so it can't see the optional
peer dependencies (`knip`, `dependency-cruiser`) that a real consumer installs.
See each package's `PUBLIC_API.md` for the full explanation before adding a new
ignored rule elsewhere - an ignored `attw` rule needs the same evidence, not a
copy-paste of these two.

**False positive:** confirm the finding is one of the two documented cases above
before ignoring a new `attw` rule; anything else in a published package is a
real defect for a consumer.

## lefthook

**Detects:** nothing by itself - it's the delivery mechanism that runs the fast
subset of the other gates locally, before a commit or push leaves the machine.

**Runs:** `pre-commit` (parallel, staged files only) - ESLint
(`--max-warnings 0 --no-warn-ignored`) and `prettier --check`. `pre-push` -
`gitleaks detect --no-banner --redact` over the full working tree.

**Threshold:** whatever the underlying tool's threshold is (see the ESLint and
gitleaks sections above).

**Why type-check and tests are excluded:** deliberately. They're slow, CI
already covers them, and a hook that takes 40 seconds gets disabled by the team
within a week. The hook trades completeness for something that actually stays
turned on.

**False positive:** if a hook blocks a commit for a reason that will also be
caught by CI, that's the hook working as intended, not a false positive. If a
hook command itself misbehaves (wrong glob, wrong working directory), fix
`lefthook.yml`/`createLefthookConfig` - never `git commit --no-verify` as a
standing habit.

## Renovate

**Detects:** nothing directly - it's the mechanism that keeps every other gate's
inputs (ESLint, TypeScript, third-party tool versions) from silently drifting
out of date, which is a precondition for every gate above staying meaningful.

**Runs:** as a scheduled GitHub App job (`before 6am on monday`,
`Europe/Madrid`), configured by `renovate.json` at the repo root and copied into
every template.

**Threshold / policy, not a pass/fail gate:**

- Patch and minor `devDependencies` bumps are grouped and auto-merged - noise a
  human doesn't need to review one PR at a time.
- ESLint, `@typescript-eslint`, and `typescript` bumps are grouped together
  (`lint and type tooling`) so a rule-set change lands as one coherent update,
  not a partial one.
- Major bumps are never auto-merged, security or not - `automerge: false` on
  `matchUpdateTypes: ["major"]` applies regardless of whether the update also
  closes a vulnerability alert, deliberately: a vulnerability fix that requires
  a major bump still needs a human to read the breaking-change notes.
- Vulnerability alerts get the `security` label; they still route through the
  same rules above rather than an unconditional automerge.

**Why:** a gate is only as good as the tool versions and rule sets running it;
Renovate is what keeps that current without turning into a manual chore that
falls behind.

**False positive:** a bump that legitimately breaks something is not a Renovate
defect - tighten the relevant `packageRules` matcher (for example, excluding a
specific package from the auto-merge group) rather than disabling Renovate for
the repo.

## Performance budget (Lighthouse, `perf:check`)

**Detects:** Core Web Vitals and Lighthouse category regressions against each
template's `.lighthouserc.json` budget.

**Runs:** `pnpm perf:check` (`turbo run perf:check`), as its **own CI step**,
separate from and after `check:ci` in the `verify` job - **not** part of
`check:ci` and **not** part of `check:quality` or `check:security`.

**Why it's CI-only and not in `check:ci`:** Lighthouse cannot obtain a first
contentful paint under headless Chrome on macOS. Verified both in an automated
shell and by a maintainer in an interactive terminal - same `NO_FCP` failure,
same exit 1, unchanged by `--headless=new --no-sandbox`. Folding it into
`check:ci` made the local pipeline permanently red on every template that could
build (real regressions were indistinguishable from the platform failure) and
pass vacuously (`0 URL(s), 0 total run(s)`) on the rest. As a step on
`ubuntu-latest`, where Chrome paints normally, the budget is enforced for real
without making `pnpm check:ci` unrunnable for anyone developing on a Mac. **Do
not move `perf:check` back into `check:ci`** - that regresses exactly the
problem this split fixed.

**False positive:** a budget regression from a deliberate, justified change (a
new above-the-fold image, a required third-party script) is fixed by updating
the specific `.lighthouserc.json` budget in the same PR as the change that
caused it, with the reason in the commit message - not by dropping `perf:check`
from CI.
