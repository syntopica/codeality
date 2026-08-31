# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Estate

- [~] Bring the rest of the estate up to the wiring the conformance check
  asserts. 2026-08-28 sweep ran `--fix` + installs across 19 consumers: matrix
  went from 23-of-24 repos failing (~77 red cells) to ~39 red cells, 2 fully
  wired (baseline, consumer-u). What remains needs a per-repo decision, except
  the lockfiles, which the 2026-08-31 release unblocked:

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
  - Action pins (`pins` column): tag-pinned actions in busirocket, consumer-ab,
    consumer-t, consumer-l, project-after - repin to commit SHAs, per repo.
  - Coverage (`cov` column): vitest configs without a `coverage:` block the
    auto-fix can patch (capture-service, busirocket, consumer-t, inbox-tool,
    consumer-f, consumer-l, consumer-i, consumer-h, consumer-p, consumer-g);
    project-after and consumer-m have no `test` script at all.
  - CI wiring (`gates`): consumer-h and consumer-q CI reaches no `check:*`
    entrypoint, so six gates sit dead; wiring the workflow is a human call.
  - consumer-y: hooks run through husky (`.husky/pre-commit`,
    `prepare: husky`); migrating to lefthook is a decision, WARN left standing.
  - The four `client-widgets-*` widgets: untouched, as excluded - they predate
    `@busirocket/quality-config` entirely; all nine baseline packages missing. A
    real migration, not `--fix` material.
