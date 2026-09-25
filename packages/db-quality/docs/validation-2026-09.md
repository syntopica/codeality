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

# Validation of 0.2.0, 2026-09-25

0.2.0 adds the PostgREST rules (BDB801-805), the live `perf snapshot` and
`perf diff` (BDB901-904), and `perf bench` (BDB911-913). It was run from the
working tree against verticagtm, a Supabase project with production traffic, and
pxpn, a Supabase project it had never seen. Every divergence found here was
fixed in the package, one commit each with a test, before the release.

## Connection: `PGOPTIONS` does not reach a pooled session

Against the Supabase session pooler,
`PGOPTIONS='-c default_transaction_read_only=on'` was ignored: a test insert
went through, into a production table, and was deleted straight away (one row,
verified gone). A session-level `SET default_transaction_read_only = on` sent as
the first command was honoured: `CREATE TEMP TABLE` was refused. Every `psql`
call therefore sends `set default_transaction_read_only = on` and
`set statement_timeout` before its query, and `PGOPTIONS` is not used anywhere.

## `init` on an existing adopter and on a new repository

| repository | step           | result                                                                                         |
| ---------- | -------------- | ---------------------------------------------------------------------------------------------- |
| verticagtm | `init`         | config merged to schemaVersion 2, workflow upgraded from the 0.1.0 asset, bench README created |
| verticagtm | `init --apply` | applied; reports adoption phase 3 of 4 (snapshot and bench record present)                     |
| pxpn       | `init`         | config, `db:gate` script, workflow and bench README planned; adoption phase 0 of 4             |
| pxpn       | `init --apply` | applied for the run, then only the generated files were reverted                               |

The first run flagged verticagtm's unmodified 0.1.0 workflow as a conflict, so
`--apply` refused. `init` now recognises the byte-exact workflow of every
earlier release by SHA-256 and upgrades it; any other edit is still a conflict.

## PostgREST rules (`check`)

| code   | verticagtm | pxpn |
| ------ | ---------- | ---- |
| BDB801 | 32         | 32   |
| BDB802 | 33         | 30   |
| BDB803 | 28         | 86   |
| BDB804 | 6          | 30   |
| BDB805 | 0          | 0    |

Ten findings per repository were read against the source and the migrations.
Three were false and are fixed:

- `Array.from({ length: n }, fn)` inside a `map` was collected as a chain whose
  root is `.from(`, and raised BDB804 three times on verticagtm, two of them in
  the sample. A chain root now needs a string literal target.
- `supabase.storage.from('client-docs').uploadToSignedUrl(...)` in a loop raised
  BDB804 on pxpn; Storage shares the method name. Chains rooted on a `.storage`
  property are skipped (two findings on pxpn).

The rest held: `select('*')`, reads with no bound on tables that grow, and
filters on columns no migration indexes (checked against every `create index`
for the table).

## Live performance (`perf snapshot`, `perf diff`)

| step                     | result                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| `perf snapshot`          | 3394 statements, 49 tables; the file stores the host, never the URL  |
| `perf diff` after 2 h 55 | 1 improvement; 2 BDB901 on pg_cron functions, exit 1, before the fix |
| `perf diff` in the gate  | `passed perf` after the fix                                          |

The two BDB901 were `ping_generation_worker` (5.00 to 7.53 ms) and
`reap_stale_generation_jobs` (4.43 to 6.72 ms), 176 calls each, with no code
change between the readings: evening pooler variance on a function a cron runs
every minute. BDB901 now also needs the mean to grow by at least 5 ms, the floor
BDB911 already had. Without it, phase 4 would fail on noise.

## Bench (`perf bench`)

Two queries the application runs: the waitlist view and the pending field
suggestions of one product. `--record` exit 0; the comparison run reported 0
findings. The waitlist query read a 2-row table whose plan estimated about 290
rows, a ratio of 97, one row away from BDB913's 100. BDB913 now only counts plan
nodes with at least 1000 estimated or actual rows.

## Gate with `perf.inGate`

| `SUPABASE_DB_PASSWORD` | perf stage                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ |
| absent                 | `skipped-not-applicable`, reason: no `--db-url` and no linked project password |
| present                | `passed perf 6.57s`                                                            |

`init` reports adoption phase 4 of 4 once `perf.inGate` is true. On verticagtm
the local gate still exits 1 on the audit stage: 94 advisor findings and 10
never-scanned indexes, the same audit debt 0.1.0 reported. CI skips that stage
because it holds no Supabase access token.
