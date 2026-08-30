# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Release

- [!] Release the five packages whose versions are bumped but never published:
  `create-baseline` 0.9.0, `eslint-config` 0.8.0, `quality-config` 0.11.0,
  `tsconfig` 0.3.0, `eslint-plugin-code-policy` 0.7.4. `pnpm release:check`
  lists all five (no tag, not on npm). This now blocks the whole estate: every
  consumer's `--fix` writes these ranges into package.json, so every lockfile
  sync fails with `ERR_PNPM_NO_MATCHING_VERSION`, and brain, rocket-agents and
  consumer-m cannot even install. Smallest unblock: run
  `brp-release` (needs npm publish authority). After publishing, re-run
  `pnpm install` in the 13 repos left with unsynced lockfiles and
  `pnpm run prepare` in consumer-h.

## Estate

- [~] Bring the rest of the estate up to the wiring the conformance check
  asserts. 2026-08-28 sweep ran `--fix` + installs across 19 consumers: matrix
  went from 23-of-24 repos failing (~77 red cells) to ~39 red cells, 2 fully
  wired (baseline, consumer-u). What remains needs either the release above or
  a per-repo decision:

  - Lockfile sync in 13 repos: blocked on the release above.
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
