# @syntopica/db-quality

Database quality gate for the projects in this estate: lints Supabase
migrations, Prisma schemas, Drizzle code and SQLite files without a database,
audits a live Supabase project, carries existing debt in a baseline and runs
everything as one gate with honest exit codes. Brings to databases what
`@syntopica/eslint-config`, `cargo-baseline` and `codeality-py` bring to code.

- **Design spec:**
  [docs/superpowers/specs/2026-09-25-db-quality-design.md](https://github.com/syntopica/codeality/blob/main/docs/superpowers/specs/2026-09-25-db-quality-design.md)

## Install

```bash
pnpm add -D @syntopica/db-quality squawk-cli prisma-lint eslint eslint-plugin-drizzle typescript-eslint
```

Install only the peers your stacks need: `squawk-cli` for Supabase migrations,
`prisma-lint` for Prisma, the three ESLint packages for Drizzle. The Supabase
CLI, `sqlite3` and `uvx` are external executables.

## Usage

```bash
codeality-db init [--check|--apply|--force]   # codeality-db.json, db:gate script, CI workflow
codeality-db check [--json]                   # static findings, never writes
codeality-db audit --linked|--db-url <url>    # live Supabase advisors, inspect, Soda
codeality-db gate                             # check or baseline check, then the linked audit
codeality-db baseline create|update|check     # record and enforce the debt you carry
```

`--project <dir>` before the command runs against another directory.

## Configuration

`codeality-db.json`, written by `init` from the stacks it detects:

```json
{
  "schemaVersion": 1,
  "supabase": { "migrations": "supabase/migrations" },
  "prisma": { "schema": "prisma/schema.prisma" },
  "drizzle": { "roots": ["src"], "objectNames": ["db", "tx"] },
  "sqlite": { "files": ["data/app.db"] },
  "audit": { "inGate": true, "bloatThreshold": 5, "soda": "db-quality/soda" },
  "disable": ["BDB100/prefer-bigint-over-int"]
}
```

Every section is optional. `audit.soda` names a directory holding a Soda Core
`checks.yml`; it runs only with `--db-url`, because a linked project carries no
database password.

## Findings

| Code               | Source                      | Severity    | What it means                                                      |
| ------------------ | --------------------------- | ----------- | ------------------------------------------------------------------ |
| `BDB001`           | permissive-policy           | warn        | a policy uses `using (true)` or `with check (true)`                |
| `BDB002`           | rls-enabled-no-policy       | info        | RLS on, no policy in any migration: service role only              |
| `BDB003`           | table-without-rls           | warn        | a `public` table never enables row level security                  |
| `BDB004`           | auth-uid-not-wrapped        | warn        | `auth.uid()` in a policy without `(select ...)`: evaluated per row |
| `BDB005`           | definer-without-search-path | warn        | `SECURITY DEFINER` function without `set search_path`              |
| `BDB100/<rule>`    | squawk                      | as squawk   | migration lock and schema hazards, Supabase profile                |
| `BDB200/<rule>`    | prisma-lint                 | warn        | relation field without an index                                    |
| `BDB300/<rule>`    | eslint-plugin-drizzle       | error       | `delete` or `update` without `.where()`                            |
| `BDB401`-`BDB403`  | sqlite3                     | error/warn  | integrity, dangling foreign keys, table without primary key        |
| `BDB500/<name>`    | Supabase advisors           | as Supabase | splinter security and performance lints on the live project        |
| `BDB601`, `BDB602` | Supabase inspect            | info/warn   | never-scanned index, table bloat over `audit.bloatThreshold`       |
| `BDB700/<check>`   | Soda Core                   | error/warn  | a failed or warned data check from `<audit.soda>/checks.yml`       |

Disable a code for a project with `"disable": ["BDB100/prefer-bigint-over-int"]`
in `codeality-db.json`.

## Baseline

`baseline create` records every current finding's fingerprint in
`.codeality-db-baseline.json`; from then on `gate` runs `baseline-check` and
fails only on findings the baseline does not carry. Fingerprints hash the code,
the path and the normalised statement, never the line number, so inserting a
migration above a known finding does not renew it.
`baseline check --check-stale` also fails on entries nothing reports any more,
so dead debt is not carried forever.

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
