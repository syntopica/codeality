# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Python baseline

- [ ] Work down the adoption debt the 2026-09-01 sweep recorded across the seven
      repositories now gating: the mypy `ignore_errors` ratchets (consumer-b
      52 modules, consumer-a 35, brain 28, consumer-d 12, consumer-c 9),
      the ruff families beside them, and the coverage floors (consumer-d 9%,
      consumer-b 5%, brain 19%, consumer-e 19%, consumer-a 35%,
      consumer-c 78%). Each floor was measured, and none may go down. Beside
      them: atrium's 19 structural findings, and the five accepted starlette
      advisories in consumer-c that fall away when platformio 7 lands.
- [ ] Rename the 22 hyphenated scripts left under brain's `tools/` (the
      `filing-*`, `credit-*`, `social-*`, `review-pass/*` families). consumer-a
      and consumer-e renamed theirs on 2026-09-01; brain's carry
      `# mypy: ignore-errors` in place because renaming means rewriting about
      150 references in the wiki's prose. Rename each when it is next touched.
- [ ] Run the Python package in this repository's own CI.
      `.github/workflows/ci.yml` has no uv step: `packages/baseline-py` sits
      outside the pnpm workspace, so `turbo run test` never reaches it and
      neither does `check:ci`, the same gap the `rust` job closed for
      cargo-baseline. Its 0.1.8 release shipped with its tests run only on this
      machine. Smallest step: a `python` job with `astral-sh/setup-uv`, then
      `uv run --project packages/baseline-py pytest` and
      `uv run --project packages/baseline-py baseline-py gate --project packages/baseline-py`,
      plus `uv run baseline-py gate` inside `templates/python-package`.
- [ ] Wire the gate into the nine adopting repositories' CI. Audit 2026-09-01:
      every gate exits 0 locally, and none runs anywhere else. Zero of nine has
      `.github/workflows/quality.yml`; consumer-c's `ci.yml` still runs the
      pre-adoption `pip install -e .[dev]`, ruff and pytest on 3.11, so mypy,
      deptry, pip-audit and the structural rules never run for it in CI; the
      pyrefly shadow stage reported `skipped-not-applicable` in every local run,
      so the quarter of artifacts the pyrefly item below waits for cannot
      accumulate. No repository has a lefthook or pre-commit hook either.
      `init --ci` exists and nobody used it. Fix the two asset defects below
      first, then `baseline-py init --ci --apply` per repository.
- [ ] `init` hard-codes the CI matrix (`'3.11', '3.13'`) and ruff
      `target-version = "py311"` instead of reading `requires-python`
      (`render_asset.py` substitutes roots and packages only). consumer-a
      and brain declare `>=3.12`, so the 3.11 cell would fail on `uv sync`
      before the gate ran; brain's `ruff.toml` says py311 against a 3.12 floor.
      `templates/python-package` has the same contradiction in its own files:
      `requires-python = ">=3.12"` and a 3.11 matrix cell. Smallest step: derive
      both from the floor in `render_asset`, and fix the template.
- [ ] `init --apply` flattens a consumer's `[tool.ruff.lint] ignore` into one
      line and drops every comment. Reproduced on a copy of consumer-a's
      pyproject: the dated ratchet (`# 456 undocumented ...`,
      `# 1707 findings total`) became a bare 45-code list; the union is correct,
      the record is gone. `init --check` reports this as a plain `merge` for
      atrium, consumer-c, consumer-b and consumer-a, so a re-run in any
      of them erases the debt ledger. Smallest step: when the existing array
      carries comments, report `conflict` instead of merging, or rebuild the
      array with tomlkit preserving the comment items.
- [ ] `templates/python-package/uv.lock` still pins busirocket-baseline-py
      0.1.0; consumer-a's pins 0.1.7. `uv lock --check` passes on both
      because the range allows it, which is why the sweep missed them.
      `uv lock --upgrade-package busirocket-baseline-py` in each.
- [ ] The estate conformance check (`create-baseline --check`) has no Python
      awareness: zero mentions of `pyproject` or `baseline-py` in
      `packages/create-baseline/bin`. The nine Python repositories are outside
      the matrix the Estate section below reports on, so "fully wired" is
      measured over the JavaScript estate only. Decide whether conformance grows
      a Python column (quality group present, gate in CI, lock pins the current
      release) or the Python side gets its own `release:check`-style script.
- [ ] The gate's mypy stage covers source roots only, so the
      `[mypy-tests.*] disallow_untyped_defs = False` section every consumer
      carries is dead configuration. `mypy tests` today: atrium 413 errors,
      nested-tool 959, consumer-c 314. Either add test roots to the stage under that
      relaxed section, as the section implies, or delete the section from the
      asset so the config stops promising what the gate does not do.
- [-] consumer-z. Its checkout is a clone of upstream `mcallegari/consumer-z`, not a
  fork, and its only Python is one 675-line fixture tool. The config and its
  baseline live there untracked so `baseline-py check` works locally; nothing
  was committed, because it could never be pushed and would conflict on every
  pull.
- [-] Decide what to do about `memstore`'s 402 inline-SQL findings. Superseded
  2026-09-01: memstore is kept for reference only, it is not ours, so it gets
  no baseline adoption at all.
- [ ] Wire `vulture` and `jscpd` into the gate as advisory stages, then decide
      from measurement whether either can block. Both were deliberately left out
      of v1: vulture's false positives on decorators and registries are
      expensive, and jscpd's Python noise is uncalibrated.
- [ ] Revisit the pyrefly shadow stage once a quarter of CI artifacts exists.
      Promotion criteria are crash rate, runtime and memory against mypy, and
      the disagreement set - not a stability label.

## Estate

- [~] Bring the rest of the estate up to the wiring the conformance check
  asserts. 2026-08-28 sweep ran `--fix` + installs across 19 consumers: matrix
  went from 23-of-24 repos failing (~77 red cells) to ~39 red cells, 2 fully
  wired. The 2026-08-31 pass took it to **10 of 24 fully wired** and ~25 red
  cells outside the four excluded `client-widgets-*` widgets, and the `pins` column
  is green estate-wide. Every repo's changes are now **committed** (2026-08-31,
  14 repos, all worktrees clean, all hooks green), unpushed. consumer-l's
  landed on `codex/discord-catchup-todo` because that is the branch its worktree
  is on; switching branches would have disturbed that session's work.

  One correction to what this file said earlier: the plan was to avoid adding
  per-repo exclusions to the release-age gate, and pnpm added them anyway during
  the installs - `minimumReleaseAgeExclude` entries for the freshly published
  @busirocket versions now sit in busirocket, consumer-t, consumer-l, consumer-h and
  consumer-g. They were kept rather than reverted: each names one exact version
  of a first-party package published minutes earlier by our own OIDC workflow
  with provenance, which is not the threat the policy exists to catch. Worth
  deciding deliberately rather than by default next release.

  Pushed 2026-08-31: baseline, capture-service, busirocket, inbox-tool,
  consumer-i, consumer-n, consumer-l (its codex branch), plus project-after and
  consumer-p, which a concurrent session had already pushed. Six could not
  be, each for its own reason, and none of them is "run push again":

  - consumer-f: **pushed 2026-08-31.** The three findings in `backend/.env`
    (commits `ac4dc81a` and `17f0831a`, April 2025) are historical and the
    repository is private, so a `.gitleaks.toml` allowlist scoped to that one
    path unblocks the gate. The file is untracked at HEAD and `.env*` is
    gitignored, so nothing can re-introduce it there. **The keys are still in
    the history and should still be rotated** - a key in a private repository's
    history is exposed to every collaborator, clone and backup, and the OpenAI
    one is billable. Rotating does not invalidate the allowlist: the rotated
    values were never committed.
  - [!] **Consumer-u: the Maps key is confirmed unrestricted.** Investigated to
    a conclusion 2026-08-31. The 38 gitleaks hits are all historical - nothing
    at HEAD carries a key except the tracked `dist/the-client.html` - and the
    open question, whether the key was referrer-restricted, now has an answer:
    it is not. A page served from `http://127.0.0.1:8731`, an origin unrelated
    to <client-domain>, loads the Maps JS API with that key and renders the map:
    `PROBE_RESULT map constructed`, no `gm_authFailure`, no
    `RefererNotAllowedMapError`, 7 tile requests served. It does carry an API
    restriction (Static Maps answers
    `This API is not activated on your API project`), so the scope is map
    rendering rather than Geocoding or Places, but rendering bills.

    It cannot be fixed from here: the key is in no GCP project that
    the personal account (6 projects) or the work account (44) can
    enumerate - every "Maps Platform API Key" found was fingerprint-compared and
    none matches - so it belongs to a third-party project, presumably
    the client's. Next step needs a person: have the project owner rotate it and
    issue one restricted to `https://<client-domain>/*`, then update
    `VITE_GOOGLE_MAPS_API_KEY` and rebuild `dist/`. Only then does allowlisting
    the historical finding make sense. The gate stays red, correctly - the six
    pending commits were pushed 2026-08-31 with a one-off
    `git push --no-verify`, deliberately leaving `.gitleaks.toml` untouched.
    That is defensible only because
    `gitleaks detect --log-opts=origin/main..HEAD` reports **no leaks** in those
    six commits: every one of the 38 findings sits in history already on origin,
    so the push added no exposure and the hook was blocking documentation over
    already-published commits. A bypass is not the answer for anything that
    introduces a new finding.

    A second unrestricted Maps key, in BusiRocket's own `project-28baa0cb`, was
    chased and **discarded**: that project is a "My First Project" from
    2026-02-12 with `billingEnabled: false`, and Maps Platform requires billing,
    so it cannot be charged. Housekeeping, not a finding.

  - [!] **consumer-g: 1352 type errors**, 1347 of them TS4111 plus 5 TS1294.
    Caused by this session: syncing the lockfile moved `@busirocket/tsconfig`
    0.2.1 to 0.3.0, whose `base.json` turns on
    `noPropertyAccessFromIndexSignature`. The commit is sound and stays local;
    the adoption is a real task, mostly mechanical (dot to bracket access), not
    a drive-by fix. Same shape as project-after's 156-error cargo-baseline adoption.
  - consumer-ab: **pushed 2026-08-31.** GitHub had it archived and read-only, so
    the sequence was `gh repo unarchive` -> push -> `gh repo archive`; it is
    archived again and local `main` is level with origin. The project is
    retired, so it should leave the estate matrix rather than keep reporting
    conformance nobody will act on.
  - consumer-t: **done via PR**, https://github.com/consumer-t/consumer-t/pull/2.
    Cherry-picking the stale local commits conflicted, so the work was redone
    against `origin/main` instead: 11 action pins, `--coverage` on the `test`
    script with the provider declared, and the thresholds block (lines 80.06,
    101 test files pass). The local `main` there is still 150 behind with three
    unmerged commits from earlier sessions - untouched, still needing a
    decision.
  - [!] consumer-h: **left alone deliberately.** Its `origin/main` is a _bun_ repo
    (`bun.lock`, `bun run` scripts, no `check:*` entrypoints), while the local
    `main` carries an unmerged pnpm adoption. Landing a coverage tweak on the
    bun side would collide with whoever finishes that migration, and the two
    have to be reconciled first. The `gates` finding here was already logged as
    a human call.

  Two remotes were on HTTPS and failed with 403 / "Repository not found" while
  every SSH remote worked; consumer-i and consumer-g now point at SSH.

  What remains:

  - Lockfile sync: **done 2026-08-31.** 12 repos were stale (capture-service,
    busirocket, consumer-ab, consumer-t, inbox-tool, consumer-f,
    consumer-l, consumer-i, consumer-h, consumer-g, consumer-n, Consumer-u); all 12
    now pass `pnpm install --frozen-lockfile`. The changes are left uncommitted
    in each repo, alongside the 2026-08-28 sweep's, for a per-repo review.
  - [!] `pnpm run prepare` in consumer-h still fails, and will until 2026-09-01
    ~10:18Z. Not a wiring problem: consumer-h enforces pnpm's `minimumReleaseAge`, and
    the three packages released today sit inside the 24-hour cutoff -
    `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION ... @busirocket/eslint-config@0.8.0 was published at 2026-08-31T09:54:54.000Z`.
    The install itself succeeds; it is the policy verification that rejects it.
    This applies to every consumer enforcing the policy, so hold the remaining
    `--fix` adoptions (the `vers` column: brain, consumer-y,
    consumer-q, rocket-agents, consumer-p, project-after,
    consumer-m) until the cutoff passes rather than adding per-repo
    exclusions to a supply-chain gate.
  - Action pins (`pins` column): **done 2026-08-31.** 54 tag pins across
    busirocket, consumer-ab, consumer-t, consumer-l and project-after now carry commit SHAs
    with the tag kept as a trailing comment. Two of them were never tags at all:
    `denoland/setup-deno@v2` and `dtolnay/rust-toolchain@stable` are moving
    _branches_, so `git/ref/tags/<tag>` 404s and they have to be resolved
    through `git/ref/heads/<name>`. `actionlint` is clean in all five.
  - Coverage (`cov` column): **done in 8 repos 2026-08-31**, and it was not
    `--fix` material - `create-baseline --fix` reports "nothing was mechanically
    fixable" when the config has no `coverage:` key at all, which was the case
    everywhere. The block was added by hand (provider v8, `autoUpdate: true`,
    every floor at 0) to capture-service, busirocket, consumer-t, inbox-tool,
    consumer-f, consumer-i, consumer-p and consumer-g; the first run
    then ratcheted each floor to what the suite actually reaches (38.39 in
    consumer-f, 89.79 in busirocket). Two remain: consumer-l has no `test`
    block in `vite.config.ts` at all, and consumer-h's install is held by the
    release-age quarantine above.
  - [!] **8 repos' `test` script was broken and nobody noticed**: capture-service,
    busirocket, consumer-t, inbox-tool, consumer-f, consumer-i, consumer-h
    and consumer-g all run `vitest run --coverage` without depending on
    `@vitest/coverage-v8`, so the script died on
    `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'` before
    running a single test. It predates this session - reproducible with the
    coverage config reverted. Fixed by adding the dependency in seven of them,
    all now green (55, 91, 79, 15, 27, 1027 and 142 test files). consumer-h is the
    eighth and waits on the quarantine. Worth a conformance rule: a `test`
    script that passes `--coverage` should assert the provider is a dependency.
  - Coverage, still open: project-after and consumer-m have no `test` script
    at all.
  - CI wiring (`gates`): consumer-h and consumer-q CI reaches no `check:*`
    entrypoint, so six gates sit dead; wiring the workflow is a human call.
  - consumer-y: hooks run through husky (`.husky/pre-commit`,
    `prepare: husky`); migrating to lefthook is a decision, WARN left standing.
  - The four `client-widgets-*` widgets: untouched, as excluded - they predate
    `@busirocket/quality-config` entirely; all nine baseline packages missing. A
    real migration, not `--fix` material.
