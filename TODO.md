# TODO

Active backlog for the `baseline` repo. Closed items move to `TODO_LOG.md`.

States: `[ ]` pending - `[~]` partial or unverified - `[!]` blocked - `[x]`
verified complete - `[-]` obsolete or superseded.

## Release

- [x] Release the five packages whose versions were bumped but never published
      -- done 2026-08-31. `eslint-plugin-code-policy` 0.7.4, `tsconfig` 0.3.0,
      `quality-config` 0.11.0, `eslint-config` 0.8.0 and `create-baseline` 0.9.0
      are on npm, and `pnpm release:check` now reports "6 packages fully
      released". No `npm login` was involved: `publish.yml` publishes tokenless
      over OIDC, which is what made this doable at all -- the token in
      `~/.npmrc` is expired and `npm whoami` returns 401. One dispatch reported
      failure with
      `E403 ... cannot publish over the previously published versions: 0.3.0`; a
      duplicate run had already published tsconfig, so the version is live and
      the failure is cosmetic. Next: re-run `pnpm install` in the 13 repos left
      with unsynced lockfiles and `pnpm run prepare` in consumer-h.

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
