# db-quality: Kysely support — Design

Date: 2026-09-30. Status: draft; the owner approved adding Kysely support
("codeality es nuestro, podemos añadir soporte"), the shape below is to be
validated against the first consumer during implementation.

## Goal

`@syntopica/db-quality` 0.3.0 detects Supabase migrations, Prisma schemas,
Drizzle code and SQLite files. A Kysely project gets nothing: no stack is
detected and `codeality-db gate` passes vacuously. Bring Kysely to the same
level as Drizzle for code, and above it for migrations, which in Kysely are
TypeScript rather than SQL files and are therefore invisible to squawk today.

Evidence: no repository in `~/p` depends on `kysely` yet (checked 2026-09-30).
The first consumer is `~/p/compratuentrada` (`Vibra-Lab/compratuentrada`), which
chose Kysely 0.29 to target MySQL/MariaDB, PostgreSQL and SQLite from one
schema, and runs statically imported migrations
(`src/db/migrations/migrationList.ts`, a `Record<string, Migration>`). Its phase
0 plan defers `codeality-db gate` adoption until this ships.

The third-party `eslint-plugin-kysely` 1.0.7 is not wrapped: one maintainer, no
release since 2025-04, about 1,000 downloads a month. The Drizzle adapter wraps
`eslint-plugin-drizzle` because that plugin is maintained by the ORM's authors;
Kysely has no equivalent.

## Configuration

```json
"kysely": {
  "roots": ["src"],
  "objectNames": ["db", "trx"],
  "migrations": {
    "module": "src/db/migrations/migrationList.ts",
    "export": "migrationList",
    "dialects": ["postgres", "mysql", "sqlite"]
  }
}
```

- `roots`, `objectNames`: as for Drizzle (`drizzleSectionFrom` pattern);
  `objectNames` defaults to `["db", "trx"]`, Kysely's conventional names.
- `migrations` is optional. `module` is a TypeScript or JavaScript file whose
  named `export` (default `migrations`) is a `Record<string, Migration>`. A
  project using `FileMigrationProvider` instead sets `"folder": "<dir>"` and
  every file's `up`/`down` exports are loaded in name order.
- `dialects` lists the engines the project claims to support; default is the
  single dialect inferred from the installed driver (`pg`, `mysql2`,
  `better-sqlite3`), and several drivers means all of them.

`detectStacks` adds a `kysely` section when `package.json` depends on `kysely`,
with the roots that exist among `src`, `server`, `app`, `lib`, `db`, and a
`migrations.module` only when exactly one file under the roots matches
`migrations/{index,migrationList}.ts` (otherwise `init` leaves it out and says
so).

## Checks

### 1. Code lint (static, in `check`)

An ESLint asset `kysely-eslint.config.mjs`, run exactly like the Drizzle one
(`--no-config-lookup`, project cwd, `--pass-on-unpruned-suppressions`), with
rules implemented inside this package (`src/eslint/kysely/`, one rule per file)
rather than a new published plugin:

| Rule id                       | Fires on                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kysely.update-without-where` | a chain rooted at `<objectName>.updateTable(...)` reaching `execute`, `executeTakeFirst` or `executeTakeFirstOrThrow` with no `where`, `whereRef` or `where(...)` callback on the chain                                                                                         |
| `kysely.delete-without-where` | the same for `deleteFrom`                                                                                                                                                                                                                                                       |
| `kysely.dynamic-raw-sql`      | `sql.raw`, `sql.lit`, `sql.id`, `sql.ref`, `sql.table` called with an argument that is not a string literal, a `const` bound to one, or a member of a `const` object/array literal (the injection paths; `sql` tagged templates with `${}` parameters are safe and not flagged) |

A deliberate whole-table update or a validated identifier is suppressed with the
standard `disable` entry or an ESLint directive naming the rule and a reason, as
for every other adapter.

### 2. Migrations compiled to SQL (static, in `check`)

For each configured dialect, load the migrations (through `jiti`, already a
runtime dependency of the ESLint config loading path; add it if not) and run
every `up`, then every `down` in reverse, against a compile-only Kysely: the
dialect's real `Adapter`, `Introspector` and `QueryCompiler` with a capturing
`Driver` whose connection records each `CompiledQuery.sql` and returns empty
results. This is Kysely's documented split between building and executing
queries; nothing touches a database.

Findings on the captured SQL:

- **PostgreSQL**: written as one `.sql` file per migration into a temp directory
  and passed through the existing squawk adapter, with the Supabase excludes
  replaced by a Kysely set (migrations run outside one transaction on MySQL, so
  `prefer-robust-stmts` stays on).
- **SQLite**: applied in order to an in-memory database with the `sqlite3`
  executable the SQLite adapter already requires, then the existing table checks
  (`primaryKeyFindings`, `foreignKeyFindings`, `integrityFindings`) run on the
  result. A statement that fails to apply is a finding
  (`kysely.migration-fails-on-sqlite`).
- **MySQL/MariaDB**: no static linter exists; the captured SQL is only hashed
  (below) and checked by the cross-dialect rules.

Cross-dialect rules:

| Rule id                         | Fires on                                                                                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kysely.migration-without-down` | a migration with no `down`                                                                                                                                                                      |
| `kysely.migration-edited`       | a released migration whose compiled SQL hash differs from `.codeality-db-kysely.json`                                                                                                           |
| `kysely.migration-order`        | names not strictly increasing, or a new migration sorted before a released one                                                                                                                  |
| `kysely.native-enum`            | `create type ... as enum` (PostgreSQL) or an `enum(` column type, when more than one dialect is configured (portability)                                                                        |
| `kysely.float-money`            | a column named `*amount*`, `*price*`, `*total*`, `*fee*` typed `real`, `float`, `double` or `numeric`/`decimal` without scale, when `money` checks are enabled (opt-in, `"moneyColumns": true`) |

`.codeality-db-kysely.json` maps migration name to `{ dialect: sha256 }` of the
compiled SQL, so reformatting the TypeScript never trips it but changing what
runs does. `codeality-db baseline create|update` writes it; a new migration is
added on `update`, an edited one is refused unless `--accept-edit <name>`.

Limitation, stated in the README: a migration that branches on data it reads
sees empty results under the capturing driver, so only the empty-database path
is compiled.

### 3. Type drift (live, in `audit`, later)

Optional and out of the first release: run `kysely-codegen` against the
`--db-url` database and diff the generated interface with the project's
hand-written `Database` type. Deferred until a consumer has a live database in
CI; recorded here so the config key (`kysely.databaseType`) is reserved.

## Integration

- `DbQualityConfig` gains `kysely?: KyselyConfig`; `CONFIG_KEYS`,
  `StackSections`, `stackSectionsFrom`, `detectStacks` and `init` follow the
  Drizzle pattern; `runCheck` calls `runKyselyLint` and
  `runKyselyMigrationChecks`.
- New peer dependencies: none beyond Drizzle's (`eslint`, `typescript-eslint`)
  plus `kysely` itself, resolved from the consumer.
- Schema version stays 2; the new section is additive.
- Release as 0.4.0.

## Testing

- Rule tests with `RuleTester` for each ESLint rule, including the chained,
  awaited, returned and transaction (`trx`) forms.
- Fixture project under `test/fixtures/kysely/` with a `migrationList.ts`
  covering: a clean migration, one without `down`, one with a native enum, one
  that fails on SQLite; golden findings per dialect.
- The hash file round trip: create, reformat source (no finding), change a
  column type (finding), `--accept-edit` (clears).
- Acceptance on the first consumer: `codeality-db check` on
  `~/p/compratuentrada` after its phase 0 Task 6 exits 0, and exits 1 after a
  deliberately introduced `db.deleteFrom('membership').execute()`.
