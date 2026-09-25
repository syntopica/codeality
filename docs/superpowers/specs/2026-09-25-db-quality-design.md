# Database Quality Gate — Design

Date: 2026-09-25 Status: Approved, conditioned on validation against the real
projects during implementation (owner, 2026-09-25: "real use always surfaces
divergences").

## Goal

Bring the discipline the code gates already enforce — findings with stable
identity, a baseline for existing debt, an aggregated gate with honest exit
codes — to the databases behind the estate's projects: schema migrations, ORM
schemas, live Postgres projects and local SQLite files. Until now nothing
audited them: no repository ran a database lint of any kind in CI.

Evidence from the real projects (measured 2026-09-25):

- Stack: Postgres via Supabase in 10 repositories (455 migration files;
  `verticagtm` 167, `pxpn` 106), MySQL via Prisma in 2 and Drizzle in 2 (plus
  Laravel and Drupal repositories outside this design), SQLite in 3.
- `supabase db advisors --linked` on `verticagtm`: 1 ERROR (a `SECURITY DEFINER`
  view), 36 tables with multiple permissive policies, 30 `SECURITY DEFINER`
  functions executable by `authenticated` and 4 by `anon`, 15 functions with
  mutable `search_path`, 6 policies re-evaluating `current_setting` per row, OTP
  expiry too long, leaked-password protection off. Three other linked projects
  answered 401/403: the logged-in CLI account has no privileges on them, so each
  project must be audited from its owning account.
- Squawk 2.66 over six Supabase repositories fires mostly on four rules that do
  not apply to Supabase migrations, which run inside one transaction with the
  CLI's own timeouts (`prefer-robust-stmts`, `require-lock-timeout`,
  `require-statement-timeout`, `require-concurrent-index-creation`). With those
  excluded the residue is real: `prefer-bigint-over-int` 51 in `verticagtm`, 53
  in `10xjoy`, 41 in `pxpn`; `ban-drop-column` 10 in `casegpt`, 8 in
  `opus-origin`; `ban-drop-table` 4 in `opus-origin`;
  `constraint-missing-not-valid` 15 to 27 per repository.
- Static grep over `supabase/migrations`: `Mains.World` enables RLS on 8 tables
  and defines 0 policies; `verticagtm` has 17, `casegpt` 12 and `10xjoy` 11
  policies with `using (true)` or `with check (true)`.
- prisma-lint `require-field-index` (all relations): `contratica` 1 relation
  field without an index, `dameticket-nextjs` 0. `require-default-empty-arrays`
  misfires on relation lists under MySQL and stays off.
- eslint-plugin-drizzle over `tieneslavibra`, `contratos`, `vexa-insight`: the
  two rules fire on a probe file and report 0 findings on the repositories.
- SQLite `integrity_check` and `foreign_key_check` pass on the three local
  databases; no table lacks a primary key.
- Soda Core 4.25 runs a `duplicate_count` check against a local Postgres, but
  only with `uvx --with setuptools`: it imports `distutils`, gone in Python
  3.12+.
- Excluded after trial: pgdsat (Linux only, calls `systemctl`; and not
  applicable to Supabase), Skeema (needs a user with CREATE on a scratch schema
  or `--workspace=docker`; the project users hold privileges on their own schema
  only), pgTAP and `supabase db lint` (need the local Docker stack; untested,
  kept as a later addition).

## Shape and distribution

New package: `packages/db-quality/`, published as `@syntopica/db-quality`,
executable `codeality-db`. TypeScript in `src/`, built with tsup to `dist/` like
`eslint-plugin-code-policy`, tested with vitest, released through the existing
`publish.yml` (add `db-quality` to its package choices).

Why a CLI in this monorepo and not factories in `@syntopica/quality-config`: the
value is in the common finding model, the baseline and the gate, which factories
cannot provide. Why TypeScript and not a Python sibling of `codeality-py`: 17 of
the 20 consuming repositories are Node projects.

Configuration file: `codeality-db.json` at the project root. JSON is native to
Node, validated against a schema shipped in the package, and matches
`syntopica.config.json` in the estate. Keys:

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

`init` writes only the sections it detects. Unknown keys are a configuration
error (exit 2), as in `codeality-py`.

## Commands

| Command                            | Writes | Purpose                                                  |
| ---------------------------------- | ------ | -------------------------------------------------------- |
| `init [--check\|--apply\|--force]` | yes    | detect stacks, write config, script and CI workflow      |
| `check [--json]`                   | no     | static findings from the repository alone                |
| `audit [--linked\|--db-url URL]`   | no     | findings from a live database                            |
| `gate`                             | no     | the whole chain, one exit code                           |
| `baseline create\|update\|check`   | yes/no | record, refresh and enforce the debt the project carries |

Exit codes are the `codeality-py` set: 0 passed, 1 policy findings, 2 invalid
usage or configuration, 3 infrastructure failure (a required tool missing or
unusable). `check` never writes. `gate` fails with 3 when a required tool is
absent rather than skipping it.

## Finding model

One `Finding` for every source: `code`, `severity` (`error`, `warn`, `info`),
`path`, `line`, `message`, `subject`, `fingerprint`, `baselineState`. Ordering
is path, line, code, as in the other baselines.

Codes are `BDB` plus a family digit:

| Family   | Source                             | Example                            |
| -------- | ---------------------------------- | ---------------------------------- |
| `BDB0xx` | rules of this package              | `BDB001 permissive-policy`         |
| `BDB1xx` | squawk                             | `BDB1xx/prefer-bigint-over-int`    |
| `BDB2xx` | prisma-lint                        | `BDB2xx/require-field-index`       |
| `BDB3xx` | eslint-plugin-drizzle              | `BDB3xx/enforce-delete-with-where` |
| `BDB4xx` | sqlite                             | `BDB401 integrity-check`           |
| `BDB5xx` | Supabase advisors (splinter names) | `BDB5xx/security_definer_view`     |
| `BDB6xx` | Supabase inspect                   | `BDB601 unused-index`              |
| `BDB7xx` | Soda checks                        | `BDB7xx/<check name>`              |

External tools are consumed through their JSON output and mapped into this
model; the tool's own rule name is kept after the family code so the upstream
documentation stays reachable. The concrete code for a tool-sourced finding is
the family's base number, `BDB100/<rule>`, `BDB200/<rule>` and so on.

## `check`: static adapters

Adapters are detected from the file system and the configuration, and each
returns findings independently.

**Supabase migrations.** Squawk (`squawk-cli`, JSON reporter) with the Supabase
profile: the four rules above excluded, everything else on. Plus five rules of
this package that need no database and cover what the live advisor finds most:

| Code     | Rule                          | Fires when                                                         |
| -------- | ----------------------------- | ------------------------------------------------------------------ |
| `BDB001` | `permissive-policy`           | a policy uses `using (true)` or `with check (true)`                |
| `BDB002` | `rls-enabled-no-policy`       | RLS is enabled on a table and no migration defines a policy for it |
| `BDB003` | `table-without-rls`           | a table is created in `public` and no migration enables RLS on it  |
| `BDB004` | `auth-uid-not-wrapped`        | a policy calls `auth.uid()` or `auth.jwt()` outside `(select ...)` |
| `BDB005` | `definer-without-search-path` | a `SECURITY DEFINER` function does not `set search_path`           |

`BDB002` and `BDB003` read the whole migration set, so a table whose RLS is
enabled in a later migration is not a finding. `BDB002` is `info`: a table
readable by the service role only is a legitimate design, and the finding exists
to make it a decision. The rest are `warn`; `BDB004` is what `auth_rls_initplan`
costs at query time, `BDB005` is what `function_search_path_mutable` means.

**Prisma.** prisma-lint with a configuration shipped in the package:
`require-field-index` with `forAllRelations`. Nothing else is on by default.

**Drizzle.** ESLint run with an internal flat configuration (typescript-eslint
parser, `drizzle/enforce-delete-with-where` and
`drizzle/enforce-update-with-where` with the configured object names) over the
configured roots, from the project directory so ESLint does not ignore them. It
never reads or changes the project's own ESLint configuration.

**SQLite.** For each configured file, through the `sqlite3` executable:
`PRAGMA integrity_check`, `PRAGMA foreign_key_check`, and tables without a
primary key (virtual and FTS tables excluded).

## `audit`: live adapters

`audit` needs a target: `--linked` (the project's `supabase/.temp/project-ref`)
or `--db-url`. It runs:

- `supabase db advisors --type all -o json`, mapped to `BDB5xx` with the
  splinter rule name, severity as reported.
- `supabase inspect db index-stats` and `bloat`: a finding for an index with
  zero scans (`BDB601`) and for bloat over `audit.bloatThreshold` (`BDB602`).
  `outliers` is printed as a report, never a finding: the top entry on
  `verticagtm` was `pg_sleep`, and a finding there would be noise.
- Soda, when `audit.soda` names a directory holding `checks.yml`:
  `uvx --with setuptools --from soda-core-<type> soda scan` with a data source
  built from the URL; each failed check is a `BDB7xx` finding. The
  `--with setuptools` is not optional: Soda 4.25 imports `distutils`.

A 401 or 403 from Supabase is an infrastructure failure (exit 3) with the
message naming the account problem, never an empty pass.

## `gate`

Stages, in order, each with the `codeality-py` semantics (a required tool that
is not installed is `FAILED_TO_RUN`, not a skip):

1. `check`, or `baseline check` when `.codeality-db-baseline.json` exists.
2. `audit --linked`, when `supabase/.temp/project-ref` exists and `audit.inGate`
   is not `false`. Linked without a usable token fails with 3, so a CI job
   without credentials must switch it off explicitly rather than pass by
   accident.

## Baseline

`.codeality-db-baseline.json` holds the fingerprints a project agrees to carry,
as in `codeality-py`. A fingerprint is `sha256(version | code | path | context)`
truncated to 16 hex characters, where `context` is the offending statement
normalised (whitespace collapsed, case folded) rather than a line number, so
inserting a migration above does not renew every finding. `baseline check` fails
on new findings and lists resolved ones, so dead debt is not carried forever.
`baseline create` on `verticagtm` records the current 455-migration debt; from
then on only new migrations can fail the gate.

## `init`

Detects the stacks, writes `codeality-db.json` with the detected sections, adds
a `db:gate` script to `package.json` and a `.github/workflows/db-quality.yml`
that runs it. `init` merges into existing files and reports a conflict rather
than overwriting; `--force` is the only way to replace a managed file.

## Dependencies

No runtime dependencies of its own. Optional peers, each required only by the
adapter that uses it: `squawk-cli`, `prisma-lint`, `eslint`,
`eslint-plugin-drizzle`, `typescript-eslint`. External executables: `supabase`,
`sqlite3`, `uvx`. A missing executable is exit 3 with the install hint in the
message.

## Testing

- Fixtures: one migration SQL fixture per package rule, positive and negative,
  including the cross-migration cases of `BDB002` and `BDB003`.
- Parsers: squawk and advisors JSON saved from the `verticagtm` runs, with
  object names replaced, so the mapping is tested without a network.
- External adapters take an injectable runner; one integration test per tool
  runs the real executable and is skipped when it is not installed.
- SQLite adapter creates its database in the test.
- Fingerprints: the same finding at a different line has the same fingerprint; a
  changed statement does not.

## Validation on the real projects (part of the plan, not after it)

The owner's condition. Each adapter is run against the repositories that
exercise it before the package is called done, and every divergence found
becomes a fixture or a rule change:

| Adapter         | Repositories                                                            |
| --------------- | ----------------------------------------------------------------------- |
| Supabase static | `verticagtm`, `pxpn`, `opus-origin`, `10xjoy`, `casegpt`, `Mains.World` |
| Prisma          | `contratica`, `dameticket-nextjs`                                       |
| Drizzle         | `tieneslavibra`, `contratos`, `vexa-insight`                            |
| SQLite          | `jobradar`, `vexa-insight`, `inbox-companion`                           |
| Audit           | `verticagtm` (the one linked project this account owns)                 |
| Soda            | a local Postgres, then `verticagtm` through `--db-url`                  |

First adoption is `verticagtm`: `init`, `baseline create`, `gate` green in CI,
then the rest of the Supabase repositories.

## Out of scope

Skeema and pgdsat (reasons above), pgTAP RLS tests and `supabase db lint` (need
the local Docker stack; a later `test` stage), MySQL live checks (Percona
Toolkit, MySQLTuner), and the Laravel and Drupal repositories.
