# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Python baseline

- [ ] Work down the adoption debt the 2026-09-01 sweep recorded across the seven
      repositories now gating: the mypy `ignore_errors` ratchets (djplayerdeluxe
      52 modules, DJCenterDeluxe 35, brain 28, agent-deluxe 12, clawd-pet 9),
      the ruff families beside them, and the coverage floors (agent-deluxe 9%,
      djplayerdeluxe 5%, brain 19%, DeluxeServerTools 19%, DJCenterDeluxe 35%,
      clawd-pet 78%). Each floor was measured, and none may go down. Beside
      them: atrium's 19 structural findings, and the five accepted starlette
      advisories in clawd-pet that fall away when platformio 7 lands.
- [ ] Rename the 22 hyphenated scripts left under brain's `tools/` (the
      `aeat-*`, `cirbe-*`, `tgss-*`, `review-pass/*` families). DJCenterDeluxe
      and DeluxeServerTools renamed theirs on 2026-09-01; brain's carry
      `# mypy: ignore-errors` in place because renaming means rewriting about
      150 references in the wiki's prose. Rename each when it is next touched.
- [ ] `baseline-py init --check` exits 2 on every adopted repository that
      carries adoption debt, so it cannot serve as a drift gate. DMX-Fixtures on
      2026-09-02: `baseline-py.toml`, `mypy.ini` and `ruff.toml` all report
      `exists and differs; use --force to replace`, and every difference is a
      section the adoption itself wrote - the dated mypy `ignore_errors`
      ratchet, the ruff `ignore` ratchet, the `[[overrides]]` for the check-rule
      naming convention, and `platform = darwin`. The README says init "merges
      into existing configuration, or reports a conflict"; a sanctioned local
      section is neither. Decide the contract: either `--check` compares only
      the keys init owns and ignores the rest, or the rendered files carry a
      marker that fences the local part. Until then no consumer can put
      `init --check` in CI, and the 2026-09-02 note that it "stays idempotent"
      in DMX-Fixtures was true of the workflow file only.
- [ ] `mypy.ini` has no way to state the platform the code runs on.
      DMX-Fixtures' `qlc_user_dir` branches on `sys.platform`, and mypy on the
      Linux runner reported the macOS branch as unreachable; the fix was a
      hand-written `platform = darwin` in the managed file (DMX-Fixtures
      2240a2f), which the next `init --force` would erase. Add a `mypy-platform`
      key (or a `[mypy]` passthrough table) to `baseline-py.toml` so init
      renders it.
- [ ] clawd-pet's pre-adoption `ci.yml` still pins `actions/checkout@v7`,
      `setup-python@v7` and friends by tag, which is the one red cell left in
      the Python estate table, and its "Host application" job repeats what
      `quality.yml` now gates with pip instead of the lockfile. Pin by commit
      and drop the job, minding `desktop/scripts/test-ci-workflow.sh`, which
      asserts the workflow's shape.
- [ ] This repository's Security gates job is red on zizmor: 117 findings, 29
      high, across the templates' workflows (`artipacked`: checkout without
      `persist-credentials: false`, and more). Pre-existing, failing on main
      since before the Python audit; the Python work did not add any. Triage by
      audit, fix the templates once, and re-render.
- [ ] Wire `vulture` and `jscpd` into the gate as advisory stages, then decide
      from measurement whether either can block. Both were deliberately left out
      of v1: vulture's false positives on decorators and registries are
      expensive, and jscpd's Python noise is uncalibrated.
- [ ] Revisit the pyrefly shadow stage once a quarter of CI artifacts exists.
      Every consumer's `quality.yml` now uploads `pyrefly-shadow-<python>` on
      each push, so the artifacts accumulate from 2026-09-02. Promotion criteria
      are crash rate, runtime and memory against mypy, and the disagreement
      set - not a stability label.
- [-] qlcplus. Its checkout is a clone of upstream `mcallegari/qlcplus`, not a
  fork, and its only Python is one 675-line fixture tool. The config and its
  baseline live there untracked so `baseline-py check` works locally; nothing
  was committed, because it could never be pushed and would conflict on every
  pull.
- [-] Decide what to do about `mempalace`'s 402 inline-SQL findings. Superseded
  2026-09-01: mempalace is kept for reference only, it is not ours, so it gets
  no baseline adoption at all.

## Estate

- [ ] `createNextjsConfig` enables `react/prop-types` through
      `react.configs.flat.recommended`, and the rule cannot see through
      `forwardRef`'s generic: every ref-forwarding primitive that destructures
      its props (`TableCell`, `Input`, shadcn's whole `ui/` folder) reports
      `'className' is missing in props validation`. In a TypeScript project the
      prop types are the validation, so adopters turn the rule off for
      `**/*.tsx` by hand (vexa-insight-dashboard, 2026-09-08). Smallest step:
      the nextjs and vite-react layers set `react/prop-types: 'off'` for `.tsx`
      files themselves.

- [~] Bring the rest of the estate up to the wiring the conformance check
  asserts. 2026-08-28 sweep ran `--fix` + installs across 19 consumers: matrix
  went from 23-of-24 repos failing (~77 red cells) to ~39 red cells, 2 fully
  wired. The 2026-08-31 pass took it to **10 of 24 fully wired** and ~25 red
  cells outside the four excluded `staffbase-*` widgets, and the `pins` column
  is green estate-wide. Every repo's changes are now **committed** (2026-08-31,
  14 repos, all worktrees clean, all hooks green), unpushed. Mains.World's
  landed on `codex/discord-catchup-todo` because that is the branch its worktree
  is on; switching branches would have disturbed that session's work.

  One correction to what this file said earlier: the plan was to avoid adding
  per-repo exclusions to the release-age gate, and pnpm added them anyway during
  the installs - `minimumReleaseAgeExclude` entries for the freshly published
  @busirocket versions now sit in busirocket, dj-rocket, Mains.World, pxpn and
  verticagtm. They were kept rather than reverted: each names one exact version
  of a first-party package published minutes earlier by our own OIDC workflow
  with provenance, which is not the threat the policy exists to catch. Worth
  deciding deliberately rather than by default next release.

  Pushed 2026-08-31: baseline, brain-capture, busirocket, inbox-companion,
  nubenode-web, vexa-mail, Mains.World (its codex branch), plus vexa and
  tieneslavibra, which a concurrent session had already pushed. Six could not
  be, each for its own reason, and none of them is "run push again":

  - livesalescoach: **pushed 2026-08-31.** The three findings in `backend/.env`
    (commits `ac4dc81a` and `17f0831a`, April 2025) are historical and the
    repository is private, so a `.gitleaks.toml` allowlist scoped to that one
    path unblocks the gate. The file is untracked at HEAD and `.env*` is
    gitignored, so nothing can re-introduce it there. **The keys are still in
    the history and should still be rotated** - a key in a private repository's
    history is exposed to every collaborator, clone and backup, and the OpenAI
    one is billable. Rotating does not invalidate the allowlist: the rotated
    values were never committed.
  - [!] **Calculadora: the Maps key is confirmed unrestricted.** Investigated to
    a conclusion 2026-08-31. The 38 gitleaks hits are all historical - nothing
    at HEAD carries a key except the tracked `dist/teleporte.html` - and the
    open question, whether the key was referrer-restricted, now has an answer:
    it is not. A page served from `http://127.0.0.1:8731`, an origin unrelated
    to teleporte.es, loads the Maps JS API with that key and renders the map:
    `PROBE_RESULT map constructed`, no `gm_authFailure`, no
    `RefererNotAllowedMapError`, 7 tile requests served. It does carry an API
    restriction (Static Maps answers
    `This API is not activated on your API project`), so the scope is map
    rendering rather than Geocoding or Places, but rendering bills.

    It cannot be fixed from here: the key is in no GCP project that
    `info@busirocket.com` (6 projects) or `cristian@favish.com` (44) can
    enumerate - every "Maps Platform API Key" found was fingerprint-compared and
    none matches - so it belongs to a third-party project, presumably
    Teleporte's. Next step needs a person: have the project owner rotate it and
    issue one restricted to `https://teleporte.es/*`, then update
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

  - [!] **verticagtm: 1352 type errors**, 1347 of them TS4111 plus 5 TS1294.
    Caused by this session: syncing the lockfile moved `@busirocket/tsconfig`
    0.2.1 to 0.3.0, whose `base.json` turns on
    `noPropertyAccessFromIndexSignature`. The commit is sound and stays local;
    the adoption is a real task, mostly mechanical (dot to bracket access), not
    a drive-by fix. Same shape as vexa's 156-error cargo-baseline adoption.
  - contratos: **pushed 2026-08-31.** GitHub had it archived and read-only, so
    the sequence was `gh repo unarchive` -> push -> `gh repo archive`; it is
    archived again and local `main` is level with origin. The project is
    retired, so it should leave the estate matrix rather than keep reporting
    conformance nobody will act on.
  - dj-rocket: **done via PR**, https://github.com/DJ-Rocket/dj-rocket/pull/2.
    Cherry-picking the stale local commits conflicted, so the work was redone
    against `origin/main` instead: 11 action pins, `--coverage` on the `test`
    script with the provider declared, and the thresholds block (lines 80.06,
    101 test files pass). The local `main` there is still 150 behind with three
    unmerged commits from earlier sessions - untouched, still needing a
    decision.
  - [!] pxpn: **left alone deliberately.** Its `origin/main` is a _bun_ repo
    (`bun.lock`, `bun run` scripts, no `check:*` entrypoints), while the local
    `main` carries an unmerged pnpm adoption. Landing a coverage tweak on the
    bun side would collide with whoever finishes that migration, and the two
    have to be reconciled first. The `gates` finding here was already logged as
    a human call.

  Two remotes were on HTTPS and failed with 403 / "Repository not found" while
  every SSH remote worked; nubenode-web and verticagtm now point at SSH.

  What remains:

  - Lockfile sync: **done 2026-08-31.** 12 repos were stale (brain-capture,
    busirocket, contratos, dj-rocket, inbox-companion, livesalescoach,
    Mains.World, nubenode-web, pxpn, verticagtm, vexa-mail, Calculadora); all 12
    now pass `pnpm install --frozen-lockfile`. The changes are left uncommitted
    in each repo, alongside the 2026-08-28 sweep's, for a per-repo review.
  - [!] `pnpm run prepare` in pxpn still fails, and will until 2026-09-01
    ~10:18Z. Not a wiring problem: pxpn enforces pnpm's `minimumReleaseAge`, and
    the three packages released today sit inside the 24-hour cutoff -
    `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION ... @busirocket/eslint-config@0.8.0 was published at 2026-08-31T09:54:54.000Z`.
    The install itself succeeds; it is the policy verification that rejects it.
    This applies to every consumer enforcing the policy, so hold the remaining
    `--fix` adoptions (the `vers` column: brain, intelifactu,
    pridefamilymedicine, rocket-agents, tieneslavibra, vexa,
    vexa-insight-dashboard) until the cutoff passes rather than adding per-repo
    exclusions to a supply-chain gate.
  - Action pins (`pins` column): **done 2026-08-31.** 54 tag pins across
    busirocket, contratos, dj-rocket, Mains.World and vexa now carry commit SHAs
    with the tag kept as a trailing comment. Two of them were never tags at all:
    `denoland/setup-deno@v2` and `dtolnay/rust-toolchain@stable` are moving
    _branches_, so `git/ref/tags/<tag>` 404s and they have to be resolved
    through `git/ref/heads/<name>`. `actionlint` is clean in all five.
  - Coverage (`cov` column): **done in 8 repos 2026-08-31**, and it was not
    `--fix` material - `create-baseline --fix` reports "nothing was mechanically
    fixable" when the config has no `coverage:` key at all, which was the case
    everywhere. The block was added by hand (provider v8, `autoUpdate: true`,
    every floor at 0) to brain-capture, busirocket, dj-rocket, inbox-companion,
    livesalescoach, nubenode-web, tieneslavibra and verticagtm; the first run
    then ratcheted each floor to what the suite actually reaches (38.39 in
    livesalescoach, 89.79 in busirocket). Two remain: Mains.World has no `test`
    block in `vite.config.ts` at all, and pxpn's install is held by the
    release-age quarantine above.
  - [!] **8 repos' `test` script was broken and nobody noticed**: brain-capture,
    busirocket, dj-rocket, inbox-companion, livesalescoach, nubenode-web, pxpn
    and verticagtm all run `vitest run --coverage` without depending on
    `@vitest/coverage-v8`, so the script died on
    `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'` before
    running a single test. It predates this session - reproducible with the
    coverage config reverted. Fixed by adding the dependency in seven of them,
    all now green (55, 91, 79, 15, 27, 1027 and 142 test files). pxpn is the
    eighth and waits on the quarantine. Worth a conformance rule: a `test`
    script that passes `--coverage` should assert the provider is a dependency.
  - Coverage, still open: vexa and vexa-insight-dashboard have no `test` script
    at all.
  - CI wiring (`gates`): pxpn and pridefamilymedicine CI reaches no `check:*`
    entrypoint, so six gates sit dead; wiring the workflow is a human call.
  - intelifactu: hooks run through husky (`.husky/pre-commit`,
    `prepare: husky`); migrating to lefthook is a decision, WARN left standing.
  - The four `staffbase-*` widgets: untouched, as excluded - they predate
    `@busirocket/quality-config` entirely; all nine baseline packages missing. A
    real migration, not `--fix` material.

## Cross-project (filed 2026-09-09 from the nubenode-web and inbox-companion backlog runs)

- [ ] **knip 6.35 reports the default export of `vite.config.ts` as unused when
      the framework preset lists `vite.config.*` under `entry`.** The Vite
      plugin already treats that file as an entry whose exports are ignored;
      naming it again as a plain project entry now surfaces
      `Unused exports: default vite.config.ts`. dj-rocket hit it the day knip
      moved 6.34 -> 6.35.1 (2026-09-12) and worked around it by overriding
      `entry: ['src/main.{ts,tsx}']` in its `knip.config.ts`. Fix in
      `knip-framework.ts`: drop `vite.config.*` from the `tauri`, `vite-react`,
      `vite-vue` and TanStack presets, or mark it as an entry with exports
      ignored, then re-run the affected repos' `pnpm knip`.
- [ ] **commitlint's `type-enum` rejects `todo:`**, the subject every repo here
      uses for backlog commits (5 of nubenode-web's last 12). No sibling repo
      has wired the `commit-msg` hook yet, so the day one does, the standard
      blocks the convention estate-wide. Either add `todo` to the shared list or
      state that backlog commits use `docs(todo):`. Evidence: nubenode-web run
      2026-09-09, `@commitlint/cli` declared there with nothing running it (its
      single knip finding).
- [ ] **`@busirocket/eslint-config` pulls `@eslint/js@10.0.1`, whose peer is
      `eslint ^10`, against the installed `eslint 9.39.5`.** Pre-existing in
      nubenode-web's HEAD lockfile and warns on every install; decide whether
      the config moves to ESLint 10 or pins `@eslint/js` 9.
- [ ] **Adoption guide: the `vite-react` tsconfig's
      `noPropertyAccessFromIndexSignature` and the quality-config lint rules
      break `check:ci` on adoption in any repository written before them.**
      inbox-companion needed three commits (12 TS4111 in `vite-plugins/db-api`,
      41 lint errors, knip on the Homebrew `gitleaks` binary and an unused
      `@commitlint/cli`) before a single backlog item could land; verticagtm's
      1352-error case above is the same shape. Worth a documented first step
      (bracket access sweep, `.prettierignore` for `.serena/`, knip ignores)
      rather than a surprise per repo.
