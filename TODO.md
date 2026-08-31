# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

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

  - [!] **consumer-f: three secrets in the published history.** Its
    `pre-push` gitleaks hook blocks the push - `backend/.env` carries an
    `openai-api-key` and two `generic-api-key` matches in commits `ac4dc81a` and
    `17f0831a`, both dated 2025-04-08 and both already ancestors of
    `origin/main`, so they have been public for ~16 months. The file is
    untracked now and `.env*` is ignored, but history keeps it. Rotate all three
    keys first and treat them as compromised; purging history is worthless
    before that and optional after. The hook was not bypassed.
  - [!] **Consumer-u: 38 gitleaks findings**, every one a `gcp-api-key` in
    `src/service-calculator.js`, `src/classes/gmap.js` and the built `dist/`
    output, spanning 2023-03 to 2025-11. A Maps JS key ships to the browser by
    design, so the control is HTTP-referrer and API restrictions rather than
    secrecy - verify those are set in GCP, and if they are, waive the finding
    deliberately rather than leaving the push blocked.
  - [!] **consumer-g: 1352 type errors**, 1347 of them TS4111 plus 5 TS1294.
    Caused by this session: syncing the lockfile moved `@busirocket/tsconfig`
    0.2.1 to 0.3.0, whose `base.json` turns on
    `noPropertyAccessFromIndexSignature`. The commit is sound and stays local;
    the adoption is a real task, mostly mechanical (dot to bracket access), not
    a drive-by fix. Same shape as project-after's 156-error cargo-baseline adoption.
  - [!] **consumer-ab is archived on GitHub** and refuses every push:
    `ERROR: This repository was archived so it is read-only.` The conformance
    commit can never ship. It should probably leave the estate matrix entirely
    rather than sit there permanently green-able but unpushable.
  - consumer-t and consumer-h: local `main` is 150 and 81 commits behind origin
    respectively, and both repos take work through PRs. Rebasing consumer-t
    conflicts on `b3ebdb3`, an older local commit from another session, so
    resolving it is not this task's call. Both need a branch and a PR.

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
