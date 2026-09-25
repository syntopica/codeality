# Validation against the estate's repositories, 2026-09-25

Every adapter was run against real repositories before the first release. Each
table lists the repository, the command, the exit code, the finding counts by
code, the divergence it exposed and the package change that closed it. Counts
are what the tool printed on the day; the repositories keep moving.

The reference for each run is the `codeality-db.json` that `init` wrote, with
its defaults, and no baseline unless the row says so. The generated files were
removed from every repository afterwards; adopting the tool in a repository is a
separate decision.

## Supabase migrations (`check`, squawk plus BDB001-005)

| repository  | exit | findings | by code                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| verticagtm  | 1    | 131      | 51 prefer-bigint-over-int, 23 constraint-missing-not-valid, 16 BDB001, 8 BDB004, 7 BDB002, 7 adding-foreign-key-constraint, 5 ban-drop-column, 4 disallowed-unique-constraint, 3 renaming-column, 3 ban-drop-not-null, 3 prefer-bigint-over-smallint, 1 BDB003                                                                                           |
| pxpn        | 1    | 165      | 42 BDB002, 41 prefer-bigint-over-int, 27 constraint-missing-not-valid, 21 adding-foreign-key-constraint, 16 BDB005, 6 disallowed-unique-constraint, 3 prefer-bigint-over-smallint, 2 BDB004, 2 ban-drop-not-null, 1 BDB001, 1 require-enum-value-ordering, 1 adding-field-with-default, 1 adding-not-nullable-field, 1 require-concurrent-index-deletion |
| opus-origin | 1    | 46       | 15 constraint-missing-not-valid, 8 ban-drop-column, 4 require-concurrent-index-deletion, 4 ban-drop-table, 3 prefer-bigint-over-int, 3 BDB001, 3 BDB002, 2 prefer-bigint-over-smallint, 1 adding-foreign-key-constraint, 1 BDB004, 1 adding-serial-primary-key-field, 1 adding-not-nullable-field                                                        |
| 10xjoy      | 1    | 119      | 53 prefer-bigint-over-int, 28 BDB005, 13 BDB002, 12 BDB004, 11 BDB001, 1 disallowed-unique-constraint, 1 constraint-missing-not-valid                                                                                                                                                                                                                    |
| casegpt     | 1    | 69       | 33 BDB004, 12 BDB001, 10 ban-drop-column, 8 prefer-bigint-over-int, 2 adding-serial-primary-key-field, 2 constraint-missing-not-valid, 1 adding-required-field, 1 require-concurrent-index-deletion                                                                                                                                                      |
| Mains.World | 1    | 15       | 8 BDB002, 3 prefer-bigint-over-int, 3 constraint-missing-not-valid, 1 prefer-identity                                                                                                                                                                                                                                                                    |

Spot checks: every sampled finding points at the first line of its statement.
verticagtm has 17 `using (true)` matches by grep and 16 BDB001 findings; the
seventeenth is inside a comment, so the tool is right. pxpn's 42 BDB002 are
genuine: 63 tables enable RLS and 52 `create policy` statements exist, and
`email_send_log` among others has none. No repository triggered
`require-lock-timeout`, which confirms the Supabase exclusion list is not what
keeps it quiet.

Divergence 1: squawk was not on `PATH` when the CLI ran from another repository,
because the monorepo hoists nothing and the binary lives in the package's own
`node_modules/.bin`. Fix: `spawnRunner` now prepends the package's bin directory
after the target repository's one.

## Prisma (`check`, prisma-lint)

| repository        | exit | findings                                                        |
| ----------------- | ---- | --------------------------------------------------------------- |
| contratica        | 1    | 1 BDB200/field-name-mapping-snake-case at `updatedBy`, line 730 |
| dameticket-nextjs | 0    | 0                                                               |
| contratos         | 0    | 0                                                               |
| jobradar          | 0    | 0                                                               |
| inbox-companion   | 0    | 0                                                               |

No divergence: prisma-lint's report on stderr parsed as the fixture predicted.

## Drizzle (`check`, eslint-plugin-drizzle)

| repository    | exit | findings                                                                                                                 |
| ------------- | ---- | ------------------------------------------------------------------------------------------------------------------------ |
| tieneslavibra | 0    | 0                                                                                                                        |
| vexa-insight  | 1    | 3 BDB300: `recoverStuckJob.ts:23` enforce-update-with-where, `deleteEveryUser.ts:14` and `:15` enforce-delete-with-where |

Divergence 2: tieneslavibra first exited 3 because eslint refused to run over a
stale `eslint-suppressions.json` in the repository. Fix: the adapter passes
`--pass-on-unpruned-suppressions`, since the suppressions file belongs to the
repository's own lint, not to this check.

## SQLite (`check`, sqlite3)

| repository   | exit | findings                                                              |
| ------------ | ---- | --------------------------------------------------------------------- |
| vexa-insight | 0    | `data/vexa.db` clean; the Drizzle findings above are the whole exit 1 |

Divergence 3: `detectStacks` picked up `.pnpm-store/v11/index.db` and the sqlite
adapter exited 3 on it. Fix: `findSqliteFiles` skips `node_modules`, `dist`,
`coverage` and any dot-directory.

## Supabase live audit (`audit --linked`, advisors plus inspect)

| repository | exit | findings                                                                                                                                                                                                                                                                                                        |
| ---------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| verticagtm | 1    | 104: 36 multiple_permissive_policies, 30 authenticated_security_definer_function_executable, 15 function_search_path_mutable, 10 BDB601, 6 auth_rls_initplan, 4 anon_security_definer_function_executable, 1 auth_leaked_password_protection, 1 auth_otp_long_expiry, 1 security_definer_view (error); 0 BDB602 |
| 10xjoy     | 3    | `LegacyDbConfigLoginRoleStatusError: unexpected login role status 403`, the logged-in CLI account does not own the project                                                                                                                                                                                      |

verticagtm's gate: `findings check 0.65s`, `findings audit 6.08s`, exit 1. The
ten BDB601 are indexes `supabase inspect db index-stats` reports with zero
scans; the plan expected none, the data disagreed, they stay informational.

Divergence 4: 10xjoy's error printed as `unknown:` because the Supabase CLI
appends plain text after its JSON error document. Fix: `parseCliError` tries
each closing brace after the document start until one parses.

## Soda (`audit --db-url` against a local Postgres)

| target                                                   | exit | result                                                                                                            |
| -------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| local `taxhacker`, two checks                            | 0    | 0 findings, `supabase: skipped, --db-url is not a Supabase project host`                                          |
| same, plus `row_count > 1000000` on `_prisma_migrations` | 1    | `BDB700/row_count > 1000000 check failed (_prisma_migrations)`, which proves the scan ran and the parser reads it |

Divergence 5: the advisors ran first and died with `LegacyDbConnectError` on a
database that is not a Supabase project, so Soda never got its turn. Decision:
`auditPlan` runs the advisors and inspect only when the URL's host ends in
`.supabase.co` or `.pooler.supabase.com`, runs Soda whenever `audit.soda` is
configured, and refuses with exit 2 when neither applies. The skipped stage is
named on stderr so a clean exit 0 is never mistaken for a full audit.

## Baseline (`baseline create`, `gate`, `baseline check`)

| repository | step              | result                                                         |
| ---------- | ----------------- | -------------------------------------------------------------- |
| verticagtm | `baseline create` | 131 entries recorded                                           |
| verticagtm | `gate`            | `passed baseline-check 1.15s`, `findings audit 10.25s`, exit 1 |
| verticagtm | `baseline check`  | 0 new, 131 known, 0 resolved, exit 0                           |

Fingerprints are line-independent, so the baseline survived the unchanged
migrations between runs as intended.

## What the numbers say about the estate

- `prefer-bigint-over-int` dominates every Supabase repository. It is squawk's
  opinion, not a bug; a project that has decided on `int` keys can list
  `BDB100/prefer-bigint-over-int` under `disable`.
- BDB002 (RLS enabled, no policy) and BDB004 (`auth.uid()` not wrapped in a
  subselect) are the two own rules that fire most, and both are real performance
  or access problems worth a migration each.
- The live audit found what static checks cannot: 34 security-definer functions
  executable by `authenticated` or `anon` on verticagtm, and one
  security-definer view flagged as an error.
