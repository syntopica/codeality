# Database Quality Gate, strict mode and performance measurement — Design

Date: 2026-09-25 Status: Approved in outline (owner, 2026-09-25: "confío en
ti"); validation against `verticagtm` and `pxpn` is part of the plan, as it was
for the first release.

## Goal

Two things the first release of `@syntopica/db-quality` does not do:

1. **Be strict.** Every finding blocks the gate unless it is recorded in the
   baseline or disabled with a written reason. There is no `info` severity to
   hide behind.
2. **Measure performance, and measure whether a change improved it.** Find slow
   and badly built queries at two layers, the application code that builds
   PostgREST queries and the live Postgres that runs them, and keep a record so
   that the next run says "faster", "slower" or "same" with numbers.

Evidence from the real projects (measured 2026-09-25 on `verticagtm`, the first
adopter):

- The application builds every query through `@supabase/supabase-js`: 297
  `.from(` chains, 56 `.rpc(`, 34 `select('*')`, 26 `.limit(`, no raw SQL.
  `pxpn` has 100 files with `.from(` and 26 `select('*')`. Nothing checks how
  those chains are built.
- A direct connection to the linked database works the way the Supabase CLI
  itself connects: `supabase/.temp/pooler-url` plus the `SUPABASE_DB_PASSWORD`
  the project already keeps in `.env.local`. Postgres 17.6 with
  `pg_stat_statements` 1.11: `queryid`, `mean_exec_time`, `stddev_exec_time`,
  `rows`, `shared_blks_read`, `temp_blks_written`, `stats_since`. `EXPLAIN`
  works. `pg_stat_statements_reset()` does not exist for the `postgres` role, so
  before/after has to come from deltas of cumulative counters.
- The top entries by total time are platform noise, not the application:
  `select pg_sleep($1)` (49.7 % of time), `SELECT name FROM pg_timezone_names`
  from PostgREST (601 ms mean, 1,729 calls), PostgREST's schema-cache CTEs, the
  WAL replication poll (2.65 M calls). The application's own statements arrive
  as `WITH pgrst_source AS ...` under `service_role` and `authenticator`, and as
  `select public.<fn>()` under `postgres` from `pg_cron`.
- The Supabase Management API `POST /v1/projects/{ref}/database/query` answers
  403 to the CLI's access token; it is not a path.
- Neither `hypopg` nor `index_advisor` is installed, so hypothetical-index
  advice is out of reach without a schema change the gate must not make.

## Shape

The subsystem lives inside `packages/db-quality`; no new package. Three
additions to the existing command set, one new dependency, one breaking change
to the configuration file, and a version bump to `0.2.0`.

```
codeality-db check                      # + BDB8xx PostgREST rules
codeality-db perf snapshot              # record pg_stat_statements and table stats
codeality-db perf diff                  # compare live counters with the snapshot
codeality-db perf bench [--record]      # run the project's bench queries with EXPLAIN ANALYZE
codeality-db gate                       # + perf stage
```

State files at the repository root, beside `.codeality-db-baseline.json`:

| file                       | written by            | holds                                 |
| -------------------------- | --------------------- | ------------------------------------- |
| `.codeality-db-perf.json`  | `perf snapshot`       | per-statement and per-table counters  |
| `.codeality-db-bench.json` | `perf bench --record` | median times and plan shape per query |

Both carry `schemaVersion`, `toolVersion`, `takenAt` and the target's host name.
Neither ever carries a password or a full connection string.

## Connection

One resolver, `resolvePostgresTarget`, used by every live command:

1. `--db-url <url>` wins.
2. Otherwise the linked project: read `supabase/.temp/pooler-url` (the CLI
   writes it on `supabase link`, user and host but no password) and take the
   password from `SUPABASE_DB_PASSWORD`. That is exactly what
   `supabase inspect db --linked` does, so a machine where the CLI works is a
   machine where this works.
3. Neither: `perf` commands exit 2 with a message naming both options; the gate
   stage reports `skipped-not-applicable`.

The driver is `psql`, called through `CommandRunner` like every other external
tool in this CLI. Every call is one `psql` process, opened with
`set default_transaction_read_only = on` and `set statement_timeout = <ms>` as
separate `-c` arguments before the query; the bench overrides the timeout with
its own `perf.benchTimeoutMs`. Measured on 2026-09-25 against a Supabase session
pooler: `PGOPTIONS='-c default_transaction_read_only=on'` does not reach the
session through the pooler (an insert went through), while the session-level
`SET` does (a `CREATE TEMP TABLE` was refused) — so `PGOPTIONS` is not used
anywhere, and the two `SET`s are sent before every query, every call. Connection
failures are infrastructure (exit 3).

A transaction pooler (port 6543 or `pgbouncer=true`) is refused as a
configuration error: the `SET` and the query could land on different backends. A
password in `--db-url` is taken out of the url and passed through `PGPASSWORD`,
so it never appears on `psql`'s argument vector.

A `PsqlSession` interface (`rows(sql) => rows`, `explain(sql) => plan`) is the
seam: adapters take it, tests give it a scripted fake, and one integration test
runs against `DB_QUALITY_TEST_DB_URL` when set.

## Configuration

`codeality-db.json` gains two sections and changes one:

```json
{
  "schemaVersion": 2,
  "supabase": { "migrations": "supabase/migrations" },
  "postgrest": { "roots": ["src", "app"] },
  "perf": {
    "inGate": true,
    "slowMs": 100,
    "regressionPercent": 20,
    "minCalls": 20,
    "seqScanRows": 10000,
    "benchDir": "db-quality/bench",
    "benchRuns": 5,
    "benchTimeoutMs": 60000,
    "roles": ["authenticator", "service_role", "postgres"],
    "ignore": []
  },
  "disable": [
    {
      "code": "BDB100/prefer-bigint-over-int",
      "reason": "int keys are a deliberate choice, see ADR-0007"
    }
  ]
}
```

- `schemaVersion` becomes `2`. A `schemaVersion: 1` file is still read in full:
  its string `disable` entries keep working and a one-line notice on stderr says
  `init --apply` will rewrite them. Under `schemaVersion: 2` a bare string is a
  configuration error whose message shows the object form. The strictness is
  opted into by bumping the version, never by upgrading the package.
- `postgrest.roots`: directories scanned for `.ts` and `.tsx` files. `init` adds
  the section when `package.json` depends on `@supabase/supabase-js`, with the
  roots among `src`, `app`, `supabase/functions` that exist.
- `perf.roles`: the database roles whose statements count as the application;
  the default is the three above.
- `perf.ignore`: regular expressions matched against the normalized statement
  text; entries extend the built-in platform-noise list, never replace it.
- `audit` keeps its shape.

## Finding model

`Severity` becomes `'error' | 'warn'`. `BDB002` (RLS enabled, no policy) and
`BDB601` (never-scanned index) move from `info` to `warn`. Every finding fails
the gate unless the baseline knows it or `disable` names it with a reason.
Fingerprints do not include severity, so a `BDB002` already in a baseline stays
known after the change; `BDB601` belongs to the audit, which `audit.inGate`
already controls.

New code families:

| code     | layer | rule                                                                                                                                                             | severity |
| -------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `BDB801` | code  | `select-star`: `.select('*')`, `.select()` or a `select` whose list contains `*`                                                                                 | warn     |
| `BDB802` | code  | `unbounded-list`: a read chain with no `limit`, `range`, `single`, `maybeSingle`, `csv`, `head: true`, and no equality on a primary or unique key                | warn     |
| `BDB803` | code  | `filter-without-index`: a filter on a literal column that no index, primary key or unique constraint in the migrations covers as its leading column              | warn     |
| `BDB804` | code  | `query-in-loop`: a `.from(` or `.rpc(` chain awaited inside `for`, `for of`, `while`, or a callback of `map`, `forEach`, `reduce`, `filter`                      | warn     |
| `BDB805` | code  | `exact-count-unbounded`: `{ count: 'exact' }` on a chain with no `limit`, `range` or `head: true`                                                                | warn     |
| `BDB901` | live  | `query-regressed`: mean time in the window grew by `regressionPercent` or more and by at least 5 ms, with at least `minCalls` calls and at least 5 ms mean       | error    |
| `BDB902` | live  | `slow-query`: mean time in the window at or above `slowMs` with at least `minCalls` calls                                                                        | warn     |
| `BDB903` | live  | `seq-scan-table`: a table with at least `seqScanRows` live rows whose sequential scans in the window outnumber index scans                                       | warn     |
| `BDB904` | live  | `temp-spill`: a statement that wrote temp blocks in the window with at least `minCalls` calls                                                                    | warn     |
| `BDB911` | bench | `bench-regressed`: median execution time grew by `regressionPercent` or more and by at least 5 ms                                                                | error    |
| `BDB912` | bench | `bench-plan-degraded`: a new `Seq Scan` on a table with at least `seqScanRows` rows, or an index scan that became a sequential one                               | error    |
| `BDB913` | bench | `bench-estimate-off`: the planner's row estimate is off by a factor of 100 or more on a plan node with at least 1000 estimated or actual rows (stale statistics) | warn     |

Fingerprints keep the existing rule: `sha256('1|code|path|context')`. For code
rules the context is the normalized chain text; for live rules it is
`role|queryid` or the table name; for bench rules the file name. Line numbers
never enter the fingerprint, so a moved query keeps its baseline identity.

## `check`: PostgREST rules (`BDB8xx`)

A new adapter, `runPostgrestRules`, walks every `.ts` and `.tsx` file under
`postgrest.roots` with the TypeScript compiler API (`typescript` becomes a peer
dependency, `>=5`; every adopter already has it through `typescript-eslint`). It
collects call chains rooted at `.from('<table>')` or `.rpc('<fn>')`, records
each method name and its literal arguments, the enclosing loop or callback, and
whether the chain is awaited or returned.

Table knowledge comes from the migration set the `BDB00x` rules already read. A
new `indexedColumns(set)` derives, per table, the leading column of every
`create [unique] index`, every `primary key` and `unique` constraint, whether
inline in `create table` or added by `alter table`. A chain on a table the
migrations never created (a view, a foreign schema) is exempt from `BDB803`,
never a false positive.

Chains whose table or column is not a string literal are exempt from every rule;
the rule reports what it can prove.

`.select('*')` inside `.rpc()` is not a `BDB801`: functions return what they
return.

## `perf snapshot` and `perf diff`

`perf snapshot` writes `.codeality-db-perf.json`:

```json
{
  "schemaVersion": 1,
  "toolVersion": "0.2.0",
  "takenAt": "2026-09-25T16:00:00Z",
  "host": "aws-0-eu-west-1.pooler.supabase.com",
  "statements": [
    {
      "role": "service_role",
      "queryId": "-1234567890",
      "text": "WITH pgrst_source AS (...)",
      "calls": 87571,
      "totalMs": 190333,
      "rows": 87571,
      "sharedBlksRead": 2,
      "tempBlksWritten": 0,
      "statsSince": "2026-09-01T10:00:00Z"
    }
  ],
  "tables": [
    {
      "name": "public.generation_jobs",
      "liveRows": 389,
      "seqScan": 30831,
      "idxScan": 321779,
      "bytes": 3006464
    }
  ]
}
```

The statement query reads `pg_stat_statements` joined to `pg_roles`, top-level
only, roles `authenticator`, `service_role`, `postgres` and any role named in
`perf.roles` (default those three), excluding the built-in noise list:
`pg_sleep`, `pg_timezone_names`, `pg_stat_statements`, PostgREST's schema-cache
CTEs (they start with `WITH -- Recursively get the base types of domains` or
select from `pg_namespace` and `pg_class` under `authenticator`), the WAL poll
(`SELECT wal->>`), `COPY` statements, and `perf.ignore`. The text is the first
200 characters after whitespace normalization; it is for humans.

`perf diff` reads the file, takes a fresh reading, and computes per statement
(matched by `role|queryId`) the window delta: `calls`, `totalMs`, `rows`,
`tempBlksWritten`. If `statsSince` changed, the counters were reset and the
fresh absolute values are the window. Then:

- `windowMean = ΔtotalMs / Δcalls` (statements with `Δcalls < minCalls` are
  skipped; they say nothing yet).
- `previousMean = totalMs / calls` at snapshot time.
- `BDB901` when `windowMean >= previousMean * (1 + regressionPercent / 100)`,
  `windowMean >= 5`, and `windowMean - previousMean >= 5`.
- `BDB902` when `windowMean >= slowMs`.
- `BDB904` when `ΔtempBlksWritten > 0`.
- `BDB903` per table with `liveRows >= seqScanRows` and `ΔseqScan > ΔidxScan`.

It also prints, before the findings, an **improvement report**: every statement
whose `windowMean` fell by `regressionPercent` or more, with both means and the
call count, and the aggregate `Σ ΔtotalMs` against what the previous means would
have cost for the same calls. That report is the answer to "did the change
help"; it is output, never a finding. `--json` returns
`{ improvements, findings }`.

Statements new since the snapshot get `BDB902` and `BDB904` only; there is no
previous mean to regress from.

## `perf bench`

`perf.benchDir` holds one `.sql` file per query the project considers critical,
written by the owner from the application's real access paths. A file is one
statement; a leading `-- runs: N` comment overrides `perf.benchRuns`. Parameters
are inline literals: the bench measures a plan, not a prepared statement.

For each file: one warm-up run, then `benchRuns` runs of
`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) <statement>`. Recorded per file: median
`Execution Time`, minimum, the set of `(node type, relation)` pairs, every
`Seq Scan` relation with its `Actual Rows`, and the worst
`Plan Rows / Actual Rows` ratio.

`perf bench --record` writes `.codeality-db-bench.json`. `perf bench` without
the flag compares against it and reports `BDB911`, `BDB912`, `BDB913`, plus an
improvement report of every file whose median fell by `regressionPercent` or
more. A file with no recorded entry yet is still judged for `BDB913` (the
estimate check needs only the current run); `BDB911` and `BDB912` need a
recorded entry to compare against, so they never fire for a file that has none.
A statement that fails to run is an infrastructure error naming the file
(`<file>: <message>`).

A file holding more than one statement is refused as a configuration error, for
a clear message; the boundary is the server. After the two session `SET`s, each
run is
`do $<tag>$ declare p text; begin execute 'explain (analyze, buffers, format json) ' || $<qtag>$<statement>$<qtag>$ into p; perform set_config('dbq.plan', p, false); end $<tag>$`,
then `select current_setting('dbq.plan')`, with random `dbq_<hex>` tags that do
not occur in the statement. PL/pgSQL `EXECUTE` refuses `COMMIT` and `ROLLBACK`,
`SET TRANSACTION READ WRITE` is rejected once the `EXPLAIN` has run, and a write
fails in the read-only transaction; the integration test proves all three. Side
effects that leave the database through `dblink` or `pg_net` are outside any
read-only session; a dedicated read-only role is the strongest boundary. The
README says so.

## `gate`

Stages become: `baseline-check` or `check` (now including `BDB8xx`), `audit`,
and `perf`. The `perf` stage runs when `perf.inGate` is true and a target
resolves; it executes `perf diff` when `.codeality-db-perf.json` exists and
`perf bench` when the bench file exists, and concatenates their findings.
Without a snapshot or a bench record it reports `skipped-not-applicable` with
the reason, so an adopter sees what is missing rather than a green stage that
measured nothing.

The baseline covers `check` findings only, as before: live findings are
measurements, and a measurement one does not like is fixed at the source, not
recorded. `disable` with a reason is the escape hatch for a live rule that does
not apply to a project.

## `init`

- Adds `postgrest.roots` when `@supabase/supabase-js` is a dependency.
- Adds the `perf` section with the defaults above, except `inGate: false`: the
  gate measures nothing until the adopter reaches phase 4.
- Creates `perf.benchDir` with a `README.md` explaining the one-statement-per-
  file rule and the read-only transaction; no example query, because an invented
  query would be measured and believed.
- Rewrites a `schemaVersion: 1` file's `disable` strings into objects with the
  reason `"carried over from schemaVersion 1; write the real reason"`, and says
  so.

## Dependencies

- `pg` (regular): the driver. `@types/pg` (dev).
- `typescript` (peer, `>=5`): the compiler API for the PostgREST rules.
- Nothing else new.

## Testing

- PostgREST rules: fixture `.ts` files under `tests/fixtures/postgrest/`, one
  per rule and one clean file, with a migration fixture that defines the
  indexes; the tests assert codes, subjects and that every finding points at the
  `.from(` line.
- `indexedColumns`: fixtures covering inline `primary key`, table-level
  `unique (a, b)`, `create unique index ... on t (a)`,
  `alter table ... add constraint ... primary key`, and a quoted identifier.
- Snapshot and diff: scripted `PsqlSession` returning fixture rows; tests cover
  the window arithmetic, the reset case (`statsSince` changed), the `minCalls`
  skip, the noise filter, the improvement report, and the JSON shape.
- Bench: scripted client returning saved `EXPLAIN` JSON (two plans per file:
  index scan and sequential scan) to cover `BDB911`-`BDB913` and the improvement
  report; a parser test on a real `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`
  output saved from Postgres 17.
- Configuration: `schemaVersion` 1 with string `disable` is rejected with the
  documented message; `init` rewrites it.
- Integration, guarded by `DB_QUALITY_TEST_DB_URL`: opens a session, proves it
  is read-only (an `insert` fails), runs one bench file against a temporary
  table created in the same session.
- Coverage thresholds stay at 85/85/80/85.

## Validation on the real projects (part of the plan)

- `verticagtm`: `check` before and after the `BDB8xx` rules, with every new
  finding sampled by hand; `perf snapshot`, wait for real traffic, `perf diff`
  with its improvement report; two bench queries written from
  `load-org-snapshot.ts` and `load-waitlist-signups.ts`; `gate` in CI still
  green on the static stage. Then update the repository's baseline and commit
  the adoption.
- `pxpn`: `check` only, for the `BDB8xx` rules on a second code style (100
  files, 26 `select('*')`).
- Every divergence is a fix in the package before the release, recorded in
  `docs/validation-2026-09.md`.

## Adoption in phases

Owner's condition (2026-09-25): a project must be able to take this in steps,
and no step may turn its CI red by itself. Every new family is off until its
configuration section exists, and every step ends with a green gate:

| phase | what the adopter does                                                                                               | what changes in the gate                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | `pnpm add -D @syntopica/db-quality@0.2`                                                                             | Nothing. `schemaVersion: 1` is read as before, `postgrest` and `perf` are absent, so no new finding exists.                                                                          |
| 1     | `init --apply` (rewrites `disable`, adds `postgrest.roots` and `perf` with `inGate: false`), then `baseline update` | `check` gains `BDB8xx`; the baseline absorbs the existing ones, so the gate stays green and only new debt fails.                                                                     |
| 2     | `perf snapshot` after a deploy, `perf diff` after the next one                                                      | Nothing yet: `perf.inGate` is false. The improvement report and the `BDB9xx` findings are read by a person.                                                                          |
| 3     | Write bench queries, `perf bench --record`                                                                          | Nothing yet. The bench file is the reference.                                                                                                                                        |
| 4     | Set `perf.inGate: true`                                                                                             | The `perf` stage runs `diff` and `bench` in the gate; regressions fail it. Locally and in any CI that holds `SUPABASE_DB_PASSWORD`; elsewhere the stage is `skipped-not-applicable`. |

`init --apply` on a phase-1 project prints the ladder with the phase it detects,
so the next step is never a guess. The README carries the same table. The
configuration example above shows `inGate: true`, which is what phase 4 sets;
`init` writes `false`.

## Out of scope

`hypopg` or `index_advisor` recommendations (need an extension the gate must not
install), `auto_explain` (server setting), query plans of PostgREST requests
through the `pgrst.plan` media type (disabled on Supabase by default), MySQL and
SQLite performance counters, and rewriting any query the rules flag.
