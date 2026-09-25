# @syntopica/db-quality

Database quality gate for the projects in this estate: lints Supabase
migrations, Prisma schemas, Drizzle code and SQLite files without a database,
audits a live Supabase project, carries existing debt in a baseline and runs
everything as one gate with honest exit codes. Brings to databases what
`@syntopica/eslint-config`, `cargo-baseline` and `codeality-py` bring to code.

- **Design spec:**
  [docs/superpowers/specs/2026-09-25-db-quality-design.md](https://github.com/syntopica/codeality/blob/main/docs/superpowers/specs/2026-09-25-db-quality-design.md)
- **Strict mode and performance design spec:**
  [docs/superpowers/specs/2026-09-25-db-quality-perf-design.md](https://github.com/syntopica/codeality/blob/main/docs/superpowers/specs/2026-09-25-db-quality-perf-design.md)

## Install

```bash
pnpm add -D @syntopica/db-quality squawk-cli prisma-lint eslint eslint-plugin-drizzle typescript-eslint
```

Install only the peers your stacks need: `squawk-cli` for Supabase migrations,
`prisma-lint` for Prisma, the three ESLint packages for Drizzle, `typescript`
for the PostgREST rules (`postgrest.roots`). The Supabase CLI, `sqlite3`, `uvx`
and `psql` are external executables; `psql` is required by the `perf` commands
and the gate's `perf` stage, and a missing one fails with exit 3 rather than
skipping silently.

## Usage

```bash
codeality-db init [--check|--apply|--force]   # codeality-db.json, db:gate script, CI workflow
codeality-db check [--json]                   # static findings, never writes
codeality-db audit --linked|--db-url <url>    # live Supabase advisors, inspect, Soda
codeality-db gate                             # check (or baseline check), the linked audit, then perf
codeality-db baseline create|update|check     # record and enforce the debt you carry
codeality-db perf snapshot|diff|bench [--db-url <url>] [--json] [--record]   # record, compare and benchmark the live database
```

`--project <dir>` before the command runs against another directory.

## Configuration

`codeality-db.json`, written by `init` from the stacks it detects. This example
is the **phase 4** configuration — see [Adoption in phases](#adoption-in-phases)
— with every section adopted and `perf.inGate: true`; `init` itself writes
`perf.inGate: false` and no `postgrest` section until `@supabase/supabase-js` is
a dependency:

```json
{
  "schemaVersion": 2,
  "supabase": { "migrations": "supabase/migrations" },
  "prisma": { "schema": "prisma/schema.prisma" },
  "drizzle": { "roots": ["src"], "objectNames": ["db", "tx"] },
  "sqlite": { "files": ["data/app.db"] },
  "postgrest": { "roots": ["src", "app"] },
  "audit": { "inGate": true, "bloatThreshold": 5, "soda": "db-quality/soda" },
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

Every section is optional. `audit.soda` names a directory holding a Soda Core
`checks.yml`; it runs only with `--db-url`, because a linked project carries no
database password. `postgrest.roots` names the directories scanned for `.ts` and
`.tsx` files. The `perf` values above are the built-in defaults except `inGate`,
which `init` always writes as `false` — the gate measures nothing until a
project reaches phase 4.

## Findings

| Code               | Source                      | Severity    | What it means                                                                                       |
| ------------------ | --------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `BDB001`           | permissive-policy           | warn        | a policy uses `using (true)` or `with check (true)`                                                 |
| `BDB002`           | rls-enabled-no-policy       | warn        | RLS on, no policy in any migration: service role only                                               |
| `BDB003`           | table-without-rls           | warn        | a `public` table never enables row level security                                                   |
| `BDB004`           | auth-uid-not-wrapped        | warn        | `auth.uid()` in a policy without `(select ...)`: evaluated per row                                  |
| `BDB005`           | definer-without-search-path | warn        | `SECURITY DEFINER` function without `set search_path`                                               |
| `BDB100/<rule>`    | squawk                      | as squawk   | migration lock and schema hazards, Supabase profile                                                 |
| `BDB200/<rule>`    | prisma-lint                 | warn        | relation field without an index                                                                     |
| `BDB300/<rule>`    | eslint-plugin-drizzle       | error       | `delete` or `update` without `.where()`                                                             |
| `BDB401`-`BDB403`  | sqlite3                     | error/warn  | integrity, dangling foreign keys, table without primary key                                         |
| `BDB500/<name>`    | Supabase advisors           | as Supabase | splinter security and performance lints on the live project                                         |
| `BDB601`, `BDB602` | Supabase inspect            | warn        | never-scanned index, table bloat over `audit.bloatThreshold`                                        |
| `BDB700/<check>`   | Soda Core                   | error/warn  | a failed or warned data check from `<audit.soda>/checks.yml`                                        |
| `BDB801`-`BDB805`  | PostgREST rules             | warn        | query-chain rules on `.ts`/`.tsx` under `postgrest.roots`; see [PostgREST rules](#postgrest-rules)  |
| `BDB901`-`BDB904`  | perf diff                   | error/warn  | live regressions, slow queries, sequential scans, temp spill; see [Performance](#performance)       |
| `BDB911`-`BDB913`  | perf bench                  | error/warn  | bench query regressions, plan degradation, stale planner estimates; see [Performance](#performance) |

Disable a code for a project with an object naming the reason:

```json
"disable": [
  {
    "code": "BDB100/prefer-bigint-over-int",
    "reason": "int keys are a deliberate choice, see ADR-0007"
  }
]
```

That is the `schemaVersion: 2` shape. A `schemaVersion: 1` file still accepts
the old bare string form (`"disable": ["BDB100/prefer-bigint-over-int"]`); see
[Strict mode](#strict-mode).

## Strict mode

`schemaVersion: 2` removes the `info` severity: every finding is now `error` or
`warn`, and every finding fails the gate unless the baseline already records it
or a `disable` entry names it with a written reason. Two codes changed severity
in 0.2.0, independent of `schemaVersion`: `BDB002` (RLS enabled, no policy) and
`BDB601` (an index that has never been scanned) moved from `info` to `warn`.
Their fingerprints did not change, so a `BDB002` already carried in a baseline
stays known.

A `schemaVersion: 1` file keeps working exactly as before: its `disable` entries
stay bare strings, and every command prints one line to stderr saying that
`codeality-db init --apply` will upgrade the file to `schemaVersion: 2` and give
each disabled rule a written reason. Under `schemaVersion: 2` a bare string
`disable` entry is a configuration error whose message shows the object form
instead. The strictness is opted into by bumping the schema version yourself;
installing 0.2.0 alone changes nothing for a `schemaVersion: 1` project.

## PostgREST rules

With a `postgrest.roots` section, `check` and `gate` walk every `.ts` and `.tsx`
file under those directories with the TypeScript compiler API and collect the
call chains rooted at `.from('<table>')` or `.rpc('<fn>')`:

| Code     | Rule                  | What it proves                                                                                                                 |
| -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `BDB801` | select-star           | `.select('*')`, `.select()`, or a column list that contains `*`                                                                |
| `BDB802` | unbounded-list        | a read with no `limit`, `range`, `single`, `maybeSingle`, `csv`, `head: true`, and no equality on a primary or unique key      |
| `BDB803` | filter-without-index  | a filter on a literal column that no index, primary key or unique constraint in the migrations covers as its leading column    |
| `BDB804` | query-in-loop         | a `.from(` or `.rpc(` chain awaited inside `for`, `for of`, `while`, or a `map`/`forEach`/`reduce`/`filter`/`flatMap` callback |
| `BDB805` | exact-count-unbounded | `{ count: 'exact' }` with no `limit`, `range` or `head: true`                                                                  |

Table knowledge for `BDB802` and `BDB803` comes from the same migration set the
`BDB00x` rules already read: the leading column of every
`create [unique] index`, `primary key` and `unique` constraint. A chain on a
table the migrations never created — a view, a table in another schema — is
exempt from `BDB803` rather than reported as a false positive, and a chain whose
table or column is not a string literal is exempt from every rule: each rule
reports only what it can prove. `.select('*')` inside `.rpc()` is not `BDB801`:
a function returns what it returns.

What these rules cannot see: a table or column name built from a variable
instead of a string literal, a filter reached through `.match()` rather than a
named method like `.eq()`, and anything about a view or a table the migrations
do not define — the index knowledge `BDB802` and `BDB803` use comes only from
`create table`, `create index` and constraint statements.

## Performance

Three commands measure a live Supabase project, and the gate's `perf` stage runs
the last two of them when `perf.inGate` is `true`:

```bash
codeality-db perf snapshot                 # record pg_stat_statements and table stats
codeality-db perf diff                     # compare a fresh reading against the snapshot
codeality-db perf bench [--record]         # EXPLAIN ANALYZE the project's own bench queries
```

`perf snapshot` writes `.codeality-db-perf.json`: per-statement counters from
`pg_stat_statements`, for the roles named in `perf.roles` (default
`authenticator`, `service_role`, `postgres`), and per-table
`pg_stat_user_tables` counters, alongside the target's host name and the tool's
own version — never a password or a connection string. `pg_stat_statements`
counters are cumulative, and the `postgres` role cannot reset them on Supabase,
so `perf diff` reads that file, takes a fresh reading, and for every matched
statement computes the window since the snapshot: the delta in calls, total time
and temp blocks written, turned back into a window mean. A statement whose
counters fell below the snapshot, or whose stats-reset timestamp moved, had its
server-side counters reset and is windowed from its current absolute values
instead, the same as a statement that is new since the snapshot.

Before the findings, `perf diff` prints an **improvement report**: every
statement whose window mean fell by `perf.regressionPercent` or more against its
snapshot mean, with both means, the call count, and the total time saved — the
answer to "did the change help", and never itself a finding. `--json` returns
`{ improvements, findings }`. Statements that are platform noise, not the
application, are excluded before any of this: `pg_sleep`, `pg_timezone_names`,
`pg_stat_statements` itself, PostgREST's schema-cache CTEs, the WAL replication
poll, `COPY` statements, and any pattern added to `perf.ignore`, which extends
that built-in list rather than replacing it.

`perf bench` runs each `.sql` file in `perf.benchDir` (default
`db-quality/bench`) as `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` inside a
read-only transaction that is always rolled back: one warm-up run, then
`perf.benchRuns` runs — or the count from a leading `-- runs: N` comment in the
file — taking the median execution time. `perf bench --record` writes
`.codeality-db-bench.json`; `perf bench` without the flag compares the current
run against that record. A `.sql` file with no recorded entry yet is still
judged for `BDB913` (the estimate check needs only the current run); `BDB911`
and `BDB912` need a recorded entry to compare against, so they never fire for a
file that has none. A write statement in the bench directory fails at run time
because the session is read-only.

| Code     | Layer | Rule                                                                                                                                         | Severity |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `BDB901` | live  | query-regressed: mean time grew by `perf.regressionPercent` or more and by at least 5 ms, at least `perf.minCalls` calls, at least 5 ms mean | error    |
| `BDB902` | live  | slow-query: mean time at or above `perf.slowMs`, at least `perf.minCalls` calls                                                              | warn     |
| `BDB903` | live  | seq-scan-table: a table with at least `perf.seqScanRows` live rows and more sequential than index scans in the window                        | warn     |
| `BDB904` | live  | temp-spill: a statement wrote temp blocks in the window, at least `perf.minCalls` calls: a sort or hash spilled to disk                      | warn     |
| `BDB911` | bench | bench-regressed: median grew by `perf.regressionPercent` or more and by at least 5 ms                                                        | error    |
| `BDB912` | bench | bench-plan-degraded: a new sequential scan on a table with at least `perf.seqScanRows` rows, or an index scan that became one                | error    |
| `BDB913` | bench | bench-estimate-off: the planner's row estimate is off by a factor of 100 or more on a plan node with at least 1000 estimated or actual rows  | warn     |

Live and bench findings are never carried in `.codeality-db-baseline.json`: they
are measurements, and a measurement nobody likes is fixed at the source, not
recorded away. `disable` with a written reason is the escape hatch for a live or
bench rule that genuinely does not apply to a project.

### Connection

The live commands connect the same way the Supabase CLI itself does:
`--db-url <url>` wins; otherwise the linked project's pooler url in
`supabase/.temp/pooler-url` (written by `supabase link`) plus the password in
`SUPABASE_DB_PASSWORD` — the same variable the Supabase CLI reads. `gate` never
takes `--db-url`; its `perf` stage resolves only from the linked project, and
reports why it skipped when no password is available. Neither
`perf snapshot`/`diff`/`bench` nor the gate's `perf` stage runs without `psql`
on `PATH`: it is a required tool, and a missing one is an infrastructure failure
(exit 3), the same as a missing Supabase CLI.

Every session opens with `set default_transaction_read_only = on` and
`set statement_timeout = <ms>` as separate arguments before the query, sent
again before every call: a Supabase session pooler was measured, on 2026-09-25,
to ignore `PGOPTIONS` for this, so `PGOPTIONS` is never used. A password `psql`
echoes back in a connection error is redacted to `***` before it reaches a
finding or the terminal.

## Adoption in phases

No step below turns a green gate red by itself; a family of findings exists only
once its section is in the configuration file:

| phase | what the adopter does                                                                                               | what changes in the gate                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | `pnpm add -D @syntopica/db-quality@0.2`                                                                             | Nothing. `schemaVersion: 1` is read as before, `postgrest` and `perf` are absent, so no new finding exists.                                                                          |
| 1     | `init --apply` (rewrites `disable`, adds `postgrest.roots` and `perf` with `inGate: false`), then `baseline update` | `check` gains `BDB8xx`; the baseline absorbs the existing ones, so the gate stays green and only new debt fails.                                                                     |
| 2     | `perf snapshot` after a deploy, `perf diff` after the next one                                                      | Nothing yet: `perf.inGate` is false. The improvement report and the `BDB9xx` findings are read by a person.                                                                          |
| 3     | Write bench queries, `perf bench --record`                                                                          | Nothing yet. The bench file is the reference.                                                                                                                                        |
| 4     | Set `perf.inGate: true`                                                                                             | The `perf` stage runs `diff` and `bench` in the gate; regressions fail it. Locally and in any CI that holds `SUPABASE_DB_PASSWORD`; elsewhere the stage is `skipped-not-applicable`. |

`codeality-db init` prints this table with the phase it detects and the next
step every time it runs, so the next move is never a guess; `--apply` prints the
same report after writing the plan.

## Baseline

`baseline create` records every current finding's fingerprint in
`.codeality-db-baseline.json`; from then on `gate` runs `baseline-check` and
fails only on findings the baseline does not carry. Fingerprints hash the code,
the path and the normalised statement, never the line number, so inserting a
migration above a known finding does not renew it.
`baseline check --check-stale` also fails on entries nothing reports any more,
so dead debt is not carried forever. The baseline covers `check` findings only:
`perf`'s live and bench findings are never recorded there — see
[Performance](#performance).

## Squawk under Supabase

Supabase runs each migration inside one transaction with the CLI's own timeouts,
so four squawk rules describe a deployment model these projects do not have and
are excluded: `prefer-robust-stmts`, `require-lock-timeout`,
`require-statement-timeout`, `require-concurrent-index-creation`.

## The audit needs the owning account

`supabase db advisors --linked` answers 401 or 403 when the logged-in CLI
account has no privileges on the project. The gate reports that as
`failed-to-run` (exit 3) rather than passing silently; set
`"audit": { "inGate": false }` for a CI job that has no token.

With `--db-url`, the advisors and inspect run only when the host is a Supabase
one (`*.supabase.co` or `*.pooler.supabase.com`); any other Postgres gets the
Soda stage alone and a `supabase: skipped` notice. A non-Supabase URL with no
`audit.soda` configured is a configuration error (exit 2).

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| 0    | All blocking checks passed.                                     |
| 1    | Findings.                                                       |
| 2    | Invalid usage or invalid configuration.                         |
| 3    | Infrastructure failure: a required tool is missing or unusable. |

## License

MIT
