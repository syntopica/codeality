# @syntopica/db-quality

Database quality gate for the projects in this estate: lints Supabase
migrations, Prisma schemas, Drizzle and Kysely code, Kysely migrations and
SQLite files without a database, audits a live Supabase project, carries
existing debt in a baseline and runs everything as one gate with honest exit
codes. Brings to databases what `@syntopica/eslint-config`, `cargo-baseline` and
`codeality-py` bring to code.

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
for the PostgREST rules (`postgrest.roots`). Kysely needs `eslint` and
`typescript-eslint`, plus `squawk-cli` when its migrations target PostgreSQL;
`kysely` itself is the project's own dependency and is never installed by this
package. The Supabase CLI, `sqlite3`, `uvx` and `psql` are external executables;
`psql` is required by the `perf` commands and the gate's `perf` stage, and a
missing one fails with exit 3 rather than skipping silently.

## Usage

```bash
codeality-db init [--check|--apply|--force]   # codeality-db.json, db:gate script, CI workflow (Supabase)
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
  "kysely": {
    "roots": ["src"],
    "objectNames": ["db", "trx"],
    "migrations": {
      "module": "src/db/migrations/migrationList.ts",
      "export": "migrationList",
      "dialects": ["postgres", "mysql", "sqlite"]
    }
  },
  "sqlite": {
    "files": ["data/app.db"],
    "queries": {
      "paths": ["src/sql"],
      "exclude": ["src/sql/migrations/**"],
      "database": "~/dev/app-copy.db",
      "minRows": 10000
    }
  },
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
project reaches phase 4. `sqlite.queries` is optional and never written by
`init`; see [SQLite query files](#sqlite-query-files). The `kysely` section is
described under [Kysely](#kysely).

Every file `codeality-db` writes (`codeality-db.json`, `package.json`, the bench
README, `.codeality-db-bench.json`, `.codeality-db-perf.json`) is passed through
the project's own `prettier --write` afterwards, so a pre-commit that runs
`prettier --check` accepts it as written. The project's Prettier config and
`.prettierignore` decide the shape; without Prettier the files stay as written.

## Findings

| Code               | Source                      | Severity    | What it means                                                                                                             |
| ------------------ | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `BDB001`           | permissive-policy           | warn        | a policy uses `using (true)` or `with check (true)`                                                                       |
| `BDB002`           | rls-enabled-no-policy       | warn        | RLS on, no policy in any migration: service role only                                                                     |
| `BDB003`           | table-without-rls           | warn        | a `public` table never enables row level security                                                                         |
| `BDB004`           | auth-uid-not-wrapped        | warn        | `auth.uid()` in a policy without `(select ...)`: evaluated per row                                                        |
| `BDB005`           | definer-without-search-path | warn        | `SECURITY DEFINER` function without `set search_path`                                                                     |
| `BDB100/<rule>`    | squawk                      | as squawk   | migration lock and schema hazards, Supabase profile                                                                       |
| `BDB200/<rule>`    | prisma-lint                 | warn        | relation field without an index                                                                                           |
| `BDB300/<rule>`    | eslint-plugin-drizzle       | error       | `delete` or `update` without `.where()`                                                                                   |
| `BDB310/<rule>`    | Kysely ESLint rules         | error       | `updateTable`/`deleteFrom` without `.where()`, dynamic raw SQL; see [Kysely](#kysely)                                     |
| `BDB320/<rule>`    | Kysely migrations           | error/warn  | migration rules on the compiled SQL; see [Kysely](#kysely)                                                                |
| `BDB401`-`BDB403`  | sqlite3                     | error/warn  | integrity, dangling foreign keys, table without primary key                                                               |
| `BDB404`-`BDB406`  | SQLite query files          | warn        | optional-parameter guard, comma-list `instr()`, full scan of a large table; see [SQLite query files](#sqlite-query-files) |
| `BDB500/<name>`    | Supabase advisors           | as Supabase | splinter security and performance lints on the live project                                                               |
| `BDB601`, `BDB602` | Supabase inspect            | warn        | never-scanned index, table bloat over `audit.bloatThreshold`                                                              |
| `BDB700/<check>`   | Soda Core                   | error/warn  | a failed or warned data check from `<audit.soda>/checks.yml`                                                              |
| `BDB801`-`BDB805`  | PostgREST rules             | warn        | query-chain rules on `.ts`/`.tsx` under `postgrest.roots`; see [PostgREST rules](#postgrest-rules)                        |
| `BDB901`-`BDB904`  | perf diff                   | error/warn  | live regressions, slow queries, sequential scans, temp spill; see [Performance](#performance)                             |
| `BDB911`-`BDB913`  | perf bench                  | error/warn  | bench query regressions, plan degradation, stale planner estimates; see [Performance](#performance)                       |

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

## Kysely

A `kysely` section is proposed by `init` when `package.json` depends on
`kysely`: `roots` are the directories among `src`, `server`, `app`, `lib` and
`db` that exist, `objectNames` defaults to `["db", "trx"]`, and `migrations` is
filled in only when exactly one `migrations/index.ts` or
`migrations/migrationList.ts` exists under the roots, with the `dialects` the
installed drivers imply written out; otherwise `init` says it left it out.
Additive: `schemaVersion` stays 2. `kysely.databaseType` is reserved for a later
type-drift audit and not read yet.

### Code rules

`check` runs ESLint over `kysely.roots` with a config shipped in this package
(`assets/kysely-eslint.config.mjs`), the same way as the Drizzle one: from the
project root, with `--no-config-lookup`, so the project's own ESLint setup is
neither read nor changed. The rules are this package's own; there is no plugin
to install.

| Code                          | Rule                 | What it proves                                                                                                                                                              |
| ----------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BDB310/update-without-where` | update-without-where | a chain rooted at `<objectName>.updateTable(...)` reaches `execute`, `executeTakeFirst` or `executeTakeFirstOrThrow` with no `where`, `whereRef`, `$if` or `$call` after it |
| `BDB310/delete-without-where` | delete-without-where | the same for `deleteFrom`                                                                                                                                                   |
| `BDB310/dynamic-raw-sql`      | dynamic-raw-sql      | `sql.raw`, `sql.lit`, `sql.id`, `sql.ref` or `sql.table` called with an argument that is not fixed in the source (see below)                                                |

A chain is recognised whether it is awaited, returned or written inside a `trx`
callback, and when the instance is reached as `this.db`. A chain split across
variables is not followed, and `$if` or `$call` counts as a guard because the
callback may add the `where`: each rule reports only what it can prove. `sql` is
matched by name.

`dynamic-raw-sql` accepts an argument fixed in the source: a literal; a `const`
bound to one; a member of a `const` object or array of literals; the variable of
`for (const t of ...)` over an array literal of literals or a `const` bound to
one; an element taken by destructuring a `const` literal tuple; and a template,
or a `const` bound to a template, whose every `${}` is one of these. The files
the project's `tsconfig.json` includes are linted with type information, so a
value TypeScript types as a literal or a union of literals passes too: an
element of an imported `as const` array, a `for...of` over one, a parameter
typed `'asc' | 'desc'`. A file outside the tsconfig, or a project without one,
gets the syntactic checks alone, which do not follow an import. A genuinely
dynamic `string` is always reported, and an `as` cast to a literal type does not
silence it. A `sql` tagged template binds its `${}` values as parameters and is
never reported. A deliberate whole-table write or a validated identifier is
suppressed with a `disable` entry or an ESLint directive naming the rule and a
reason.

### Migrations

With `kysely.migrations`, `check` loads the project's migrations and compiles
each one per dialect, without a database. `module` names a file whose `export`
(default `migrations`) is a `Record<string, Migration>`; a project using
`FileMigrationProvider` sets `"folder": "<dir>"` instead, and every file's
`up`/`down` (or its default export) is loaded in name order. `dialects` lists
the engines the project supports, any of `postgres`, `mysql`, `sqlite`; without
it, the dialects are inferred from the installed drivers (`pg`, `mysql2`,
`better-sqlite3`), and a project with none of them is a configuration error.

The migrations run in a separate Node process, through `jiti`, with the
project's own `kysely` and the path aliases (`compilerOptions.paths`, through
`extends`) of its `tsconfig.json`, so a migrations module may import
`@/db/migrations/...` as the application does: every `up` in order, then every
`down` in reverse, against a Kysely instance built from the dialect's real
adapter, introspector and query compiler and a driver that records each query
and returns no rows. A missing `kysely` exits 3. Then:

- **PostgreSQL**: each migration's SQL goes through squawk (`BDB100/<rule>`,
  reported on the migration) with `require-lock-timeout`,
  `require-statement-timeout` and `require-concurrent-index-creation` excluded.
  `prefer-robust-stmts` stays on, unlike under Supabase: on MySQL the same
  migrations run outside any transaction. When more than one dialect is
  configured, squawk's PostgreSQL-only type advice is excluded too:
  `prefer-text-field`, `ban-char-field`, `prefer-timestamp-tz` and
  `prefer-bigint-over-int`. A portable schema needs `varchar(n)` for an indexed
  or unique column on MySQL, so following them would make the migrations
  PostgreSQL-only.
- **SQLite**: the migrations are applied in order to a scratch database in a
  temporary directory with the `sqlite3` shell, one transaction per migration,
  then `BDB401`-`BDB403` run on the result. A statement SQLite refuses is
  `BDB320/migration-fails-on-sqlite`, naming the statement.
- **MySQL/MariaDB**: no static linter exists; the SQL is hashed and checked by
  the rules below.

| Code                                | Severity | What it proves                                                                                                                                                    |
| ----------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BDB320/migration-without-down`     | warn     | a migration with no `down`                                                                                                                                        |
| `BDB320/migration-order`            | error    | a name that does not sort after the one declared before it, or a new migration sorting before a released one                                                      |
| `BDB320/migration-edited`           | error    | a released migration whose compiled SQL no longer matches `.codeality-db-kysely.json`                                                                             |
| `BDB320/native-enum`                | warn     | `create type ... as enum` or an `enum(` column type, when more than one dialect is configured                                                                     |
| `BDB320/float-money`                | warn     | with `"moneyColumns": true`: a column named `*amount*`, `*price*`, `*total*` or `*fee*` typed `real`, `float`, `double`, or `numeric`/`decimal` without a scale   |
| `BDB320/inline-references`          | error    | with `mysql` configured: a column-level `.references()` in a `create table` or `alter table`, which MySQL 8.4 parses and ignores; use `addForeignKeyConstraint()` |
| `BDB320/migration-fails-on-sqlite`  | error    | SQLite refuses the compiled SQL, or the migration throws while compiling for SQLite                                                                               |
| `BDB320/migration-does-not-compile` | error    | the migration throws while compiling for PostgreSQL or MySQL                                                                                                      |

The findings carry the path of the module (or the migration's file) and the line
that names the migration; the `subject` is the migration's name.

`.codeality-db-kysely.json` maps each released migration's name to a SHA-256 of
what it compiles to, per dialect, so reformatting the TypeScript never trips
`migration-edited` and changing what runs always does. `baseline create` and
`baseline update` write it alongside the baseline: a new migration is added, a
newly configured dialect is added to a released one, and an edited migration is
refused (exit 2) unless it is named with
`baseline update --accept-edit <name>[,<name>]`.

Limitation: the capturing driver returns no rows, so a migration that branches
on data it reads only has its empty-database path compiled, checked and hashed.

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
a function returns what it returns. A chain rooted at `<expr>.storage.from(...)`
(e.g. `supabase.storage.from('bucket')`) is a Supabase Storage call, not
PostgREST, and is skipped by every rule; a bucket reached through an aliased
variable is not recognized.

What these rules cannot see: a table or column name built from a variable
instead of a string literal, a filter reached through `.match()` rather than a
named method like `.eq()`, and anything about a view or a table the migrations
do not define — the index knowledge `BDB802` and `BDB803` use comes only from
`create table`, `create index` and constraint statements.

## SQLite query files

An application that keeps its SQLite queries in `.sql` files (loaded with
`include_str!`, `readFileSync` or the like) can have `check` and `gate` read
them. `sqlite.queries.paths` names directories, relative to the project root,
walked recursively for `*.sql`; each file is split into statements, comments
removed, and only statements starting with `SELECT`, `WITH`, `UPDATE`, `DELETE`,
`INSERT` or `REPLACE` are considered. Findings carry the line of the match.
`sqlite.queries.exclude` takes root-relative globs of files to leave out, such
as one-shot data migrations that scan on purpose (`src/sql/migrations/**`).

| Code     | Rule                     | What it proves                                                                                                                                                                                    |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BDB404` | optional-parameter-guard | `?1 IS NULL OR ...` (or `... OR ?1 IS NULL`, with `?`, `?NNN`, `:name`, `@name`, `$name`): SQLite plans at prepare time, before the value is bound, so the guarded column's index is out of reach |
| `BDB405` | comma-list-membership    | `instr(',' \|\| ?1 \|\| ',', ',' \|\| col \|\| ',')`: list membership no index can answer; bind a JSON array and use `col IN (SELECT value FROM json_each(?1))`                                   |
| `BDB406` | full-scan                | with `sqlite.queries.database`, `EXPLAIN QUERY PLAN` shows `SCAN <table>` or `SCAN <table> USING [COVERING] INDEX` on a table of at least `minRows` rows                                          |

`BDB404` and `BDB405` need nothing but the files. `BDB406` needs
`sqlite.queries.database`: a SQLite file whose schema matches the queries,
usually a local copy of the application's store. It is resolved against the
project root; a leading `~/` is the home directory; an absolute path is used as
is. It is opened with `sqlite3 -readonly`. Every statement is planned with its
parameters left unbound, which is the plan the application gets at prepare time;
binding a literal would let SQLite fold a `?1 IS NULL OR` guard away and show a
plan the application never runs. A `SCAN` of a CTE, a subquery, a constant row
or a virtual table is not reported; an alias is resolved to its table through
the statement's `FROM`/`JOIN`. Rows are counted once per table per run, the
default `minRows` is 10000, and there is at most one finding per file, table and
scan kind. When the same plan also sorts the rows in a temporary B-tree for
`ORDER BY`, the message says so.

With a database, `BDB404` is also checked against the plan: a guard beside a
filter that already seeks an index (`id = ?2 AND (?1 IS NULL OR ...)`) scans
nothing, so it is not reported. An `UPDATE` or `DELETE` with no `WHERE` writes
the whole table by definition and is not reported as a `BDB406` scan.

A statement `sqlite3` cannot plan is skipped rather than failed: a table the
application creates at run time, a module the shell lacks, syntax the shell
rejects. A function the application registers itself (`vexa_strip_digits`) does
not stop `EXPLAIN QUERY PLAN` in current shells, so those statements are still
planned. A configured database that does not exist or is not readable skips
`BDB406` with one line on stderr naming the path, and the static rules still
run, so a CI runner without the local copy stays green on what it can check. A
scan that is intended (a batch job, a garbage collector) is carried in the
baseline or the rule is disabled with a reason.

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

The window mean is judged against a **reference mean**. When `perf snapshot`
runs over an earlier snapshot, it records on each statement the mean of the
window between the two (`windowMeanMs`), and `perf diff` compares against that:
the recent past, not every slow week since the stats reset. A first snapshot, a
statement new since the last one, or one whose counters reset has no recorded
window mean, and falls back to the cumulative mean since the reset. So refresh
the reference with `perf snapshot` twice before relying on BDB901: once to start
a window, once more after representative traffic to record it. The diff still
reads production-wide counters, so traffic unrelated to a commit can still move
a mean; that is why the gate's `perf` stage stays opt-in (`perf.inGate`).

Before the findings, `perf diff` prints an **improvement report**: every
statement whose window mean fell by `perf.regressionPercent` or more against its
snapshot mean, with both means, the call count, and the total time saved — the
answer to "did the change help", and never itself a finding. `--json` returns
`{ improvements, findings }`. Statements that are platform noise, not the
application, are excluded before any of this: `pg_sleep`, `pg_timezone_names`,
`pg_stat_statements` itself, PostgREST's schema-cache CTEs, the WAL replication
poll, `COPY` statements, and any statement containing one of the plain
substrings (not patterns) listed in `perf.ignore`, which extends that built-in
list rather than replacing it.

`perf bench` runs each `.sql` file in `perf.benchDir` (default
`db-quality/bench`) as `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`: one warm-up
run, then `perf.benchRuns` runs — or the count from a leading `-- runs: N`
comment in the file — taking the median execution time. `perf bench --record`
writes `.codeality-db-bench.json`; `perf bench` without the flag compares the
current run against that record. A `.sql` file with no recorded entry yet is
still judged for `BDB913` (the estimate check needs only the current run);
`BDB911` and `BDB912` need a recorded entry to compare against, so they never
fire for a file that has none. A statement that fails to run is an
infrastructure error (exit 3) naming the file.

A bench file is one statement; a file holding more than one is refused as a
configuration error. The server, not that check, is the boundary: the statement
reaches Postgres as a dollar-quoted literal opened as a PL/pgSQL cursor inside a
`DO` block, in a session that is read-only before it starts, and the plan comes
back through a session setting. A cursor over more than one statement is
refused, so nothing after the `EXPLAIN` ever runs; a write fails in the
read-only transaction; and the cursor runs in an inner block that is always
rolled back, which undoes what a read-only transaction does not stop:
`EXPLAIN ANALYZE` of `CREATE TABLE AS`, `SELECT INTO` or
`CREATE MATERIALIZED VIEW` writes even there.

Some side effects are outside any transaction and no read-only session stops
them: calls that leave the database through `dblink` or `pg_net`; for a role
with `REPLICATION`, a replication slot, which persists and retains WAL until it
is dropped; and, for a superuser, `COPY ... TO PROGRAM`, `lo_export`,
`pg_terminate_backend` and `pg_stat_statements_reset`. The strongest boundary is
a dedicated role that is not a superuser, has no `REPLICATION`, and can only
read; point `--db-url` at it for `perf`.

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
to ignore `PGOPTIONS` for this, so `PGOPTIONS` is never used. A transaction
pooler (port 6543, or `pgbouncer=true` in the url) is refused as a configuration
error: it can run each statement on a different backend, so the read-only
setting would not hold, and it would stay behind on a connection the application
shares. Use the session pooler (port 5432) or a direct connection.

The password reaches `psql` through `PGPASSWORD` only: a password in `--db-url`
is taken out of the url before `psql` sees its arguments, and `PGPASSWORD` is
left as it is when no password is given. A password `psql` echoes back in a
connection error is redacted to `***` before it reaches a finding or the
terminal.

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
