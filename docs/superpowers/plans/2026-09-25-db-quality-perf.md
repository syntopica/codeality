# Database Quality Gate, strict mode and performance measurement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@syntopica/db-quality` 0.2.0: every finding blocks unless
recorded or disabled with a reason, five static rules on the PostgREST query
chains in application code, and a `perf` command family that snapshots
`pg_stat_statements`, diffs it with an improvement report, and benchmarks the
project's own queries with `EXPLAIN ANALYZE`, all adoptable in phases that never
turn a gate red by themselves.

**Architecture:** Everything stays inside `packages/db-quality`, synchronous end
to end like the rest of the CLI. The live Postgres path goes through `psql`
invoked by the existing `CommandRunner` (scripted in tests, `spawnSync` in
production) with a session-level `set default_transaction_read_only = on`,
because the CLI is synchronous and the Supabase pooler ignores `PGOPTIONS`
(measured 2026-09-25: an insert went through with
`PGOPTIONS='-c default_transaction_read_only=on'`; the `SET` refused a
`CREATE TEMP TABLE`). The PostgREST rules parse `.ts`/`.tsx` with the TypeScript
compiler API, no type information. Two new state files beside the baseline hold
the perf snapshot and the bench record.

**Tech Stack:** TypeScript (ESM, tsup, vitest), `typescript` compiler API
(peer), `psql` (system tool, PostgreSQL client), `pg_stat_statements` 1.10+ on
the target.

**Spec:** `docs/superpowers/specs/2026-09-25-db-quality-perf-design.md` (read it
first; this plan deviates from it in one place, recorded under Global
Constraints).

## Global Constraints

- Monorepo rules: one exported unit per file, no non-exported top-level
  constants or types (`no-hidden-top-level-declarations`: every constant and
  type gets its own file), no inline object types in runtime files, `max-params`
  4, `complexity` 10, `max-lines-per-function` 50, `max-lines` 100,
  `--max-warnings 0`. Filenames must not start with `validate`, `format`, `map`,
  `select`, `use` unless they live in the matching directory
  (`file-kind-placement`): the plan names files to avoid the prefixes.
- Never put a password or a connection string in a finding, a state file, an
  error message or a test fixture. `PostgresTarget.host` is the only connection
  detail that reaches disk.
- Every live session opens with `set default_transaction_read_only = on` and
  `set statement_timeout = <ms>` as separate `-c` arguments before the query;
  `PGOPTIONS` is not used anywhere.
- Deviation from the spec, decided while planning: the driver is `psql` through
  `CommandRunner`, not the `pg` package. Reason: every command in this CLI
  returns a number synchronously and every external tool already goes through
  the runner; a Node driver would force `runCli`, `COMMANDS`, the gate and every
  test onto promises. `psql` is on the developer machines (Homebrew) and on
  GitHub's `ubuntu-latest` images; where it is missing the tool answers
  `ToolMissingError` (exit 3) like squawk or the Supabase CLI. Update the spec's
  Connection section in Task 6.
- Exit codes stay: 0 OK, 1 findings, 2 configuration, 3 infrastructure.
- Version 0.2.0. `schemaVersion: 1` configuration files keep working; only
  `schemaVersion: 2` enforces `disable` objects.
- Commit after every task with a conventional message; push `main`
  (`git pull --rebase && git push origin main`) at the end of every task.
  `pnpm --filter @syntopica/db-quality lint` and `test` must be green before
  each commit (lefthook runs prettier and eslint on staged files, commitlint on
  the message).
- Run every package command from `packages/db-quality`: `pnpm test`,
  `pnpm lint`, `pnpm build`, `pnpm type-check`.

---

### Task 1: Strict severities and `disable` entries with a reason

**Files:**

- Modify: `src/model/Severity.ts`
- Modify: `src/rules/rlsEnabledNoPolicy.ts` (severity),
  `src/adapters/supabase/parseIndexStats.ts` (severity)
- Create: `src/config/DisableEntry.ts`, `src/config/disableEntriesFrom.ts`,
  `src/config/LEGACY_DISABLE_REASON.ts`, `src/config/legacyConfigNotice.ts`
- Modify: `src/config/DbQualityConfig.ts`, `src/config/configFromDocument.ts`,
  `src/config/isDisabled.ts`, `src/rules/runSqlRules.ts` and every caller that
  passes `config.disable` (they keep passing it; the type changes)
- Test: `tests/config/disableEntriesFrom.test.ts`,
  `tests/config/configFromDocument.test.ts` (extend),
  `tests/config/isDisabled.test.ts`

**Interfaces:**

- Produces: `type DisableEntry = { code: string; reason: string }`;
  `DbQualityConfig.disable: DisableEntry[]`;
  `DbQualityConfig.schemaVersion: 1 | 2`;
  `isDisabled(code: string, disabled: DisableEntry[]): boolean`;
  `legacyConfigNotice(config: DbQualityConfig): string | undefined`;
  `LEGACY_DISABLE_REASON` string.

- [ ] **Step 1: Failing tests for the entry parser**

```ts
// tests/config/disableEntriesFrom.test.ts
import { describe, expect, it } from 'vitest'

import { disableEntriesFrom } from '@/config/disableEntriesFrom.js'
import { LEGACY_DISABLE_REASON } from '@/config/LEGACY_DISABLE_REASON.js'

describe('disableEntriesFrom', () => {
  it('accepts objects with a code and a reason', () => {
    expect(
      disableEntriesFrom([{ code: 'BDB001', reason: 'documented' }], 2),
    ).toEqual([{ code: 'BDB001', reason: 'documented' }])
  })
  it('carries strings over under schemaVersion 1 with the legacy reason', () => {
    expect(disableEntriesFrom(['BDB001'], 1)).toEqual([
      { code: 'BDB001', reason: LEGACY_DISABLE_REASON },
    ])
  })
  it('rejects a string under schemaVersion 2 and shows the object form', () => {
    expect(() => disableEntriesFrom(['BDB001'], 2)).toThrow(
      /disable entries must be \{ "code": "BDB001", "reason": "why" \}/,
    )
  })
  it('rejects an empty reason and a missing code', () => {
    expect(() =>
      disableEntriesFrom([{ code: 'BDB001', reason: '' }], 2),
    ).toThrow(/reason must not be empty/)
    expect(() => disableEntriesFrom([{ reason: 'x' }], 2)).toThrow(
      /code must be a string/,
    )
    expect(() => disableEntriesFrom('BDB001', 2)).toThrow(
      /disable must be a list/,
    )
  })
})
```

```ts
// tests/config/isDisabled.test.ts
import { describe, expect, it } from 'vitest'

import { isDisabled } from '@/config/isDisabled.js'

describe('isDisabled', () => {
  it('matches on the code only', () => {
    expect(isDisabled('BDB001', [{ code: 'BDB001', reason: 'r' }])).toBe(true)
    expect(isDisabled('BDB002', [{ code: 'BDB001', reason: 'r' }])).toBe(false)
  })
})
```

Extend `tests/config/configFromDocument.test.ts` with:

```ts
it('reads schemaVersion 2 with object disable entries', () => {
  const config = configFromDocument({
    schemaVersion: 2,
    disable: [{ code: 'BDB001', reason: 'r' }],
  })
  expect(config.schemaVersion).toBe(2)
  expect(config.disable).toEqual([{ code: 'BDB001', reason: 'r' }])
})
it('still reads schemaVersion 1 with string entries', () => {
  expect(
    configFromDocument({ schemaVersion: 1, disable: ['BDB001'] }).disable[0]
      ?.code,
  ).toBe('BDB001')
})
it('rejects any other schemaVersion', () => {
  expect(() => configFromDocument({ schemaVersion: 3 })).toThrow(
    /schemaVersion must be 1 or 2/,
  )
})
```

- [ ] **Step 2: Run, expect failures** — `pnpm test -- tests/config` fails on
      missing modules and the old `disable must be a list of strings` message.

- [ ] **Step 3: Implement**

```ts
// src/config/DisableEntry.ts
/** A rule switched off on purpose; the reason is what makes it a decision rather than a silence. */
export type DisableEntry = { code: string; reason: string }
```

```ts
// src/config/LEGACY_DISABLE_REASON.ts
export const LEGACY_DISABLE_REASON =
  'carried over from schemaVersion 1; write the real reason'
```

```ts
// src/config/disableEntriesFrom.ts
import { ConfigError } from '@/config/ConfigError.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { LEGACY_DISABLE_REASON } from '@/config/LEGACY_DISABLE_REASON.js'

const entryFrom = (raw: unknown, schemaVersion: 1 | 2): DisableEntry => {
  if (typeof raw === 'string') {
    if (schemaVersion === 1) return { code: raw, reason: LEGACY_DISABLE_REASON }
    throw new ConfigError(
      `disable entries must be { "code": "${raw}", "reason": "why" } under schemaVersion 2`,
    )
  }
  if (typeof raw !== 'object' || raw === null)
    throw new ConfigError('disable entries must be objects')
  const { code, reason } = raw as Record<string, unknown>
  if (typeof code !== 'string')
    throw new ConfigError('disable code must be a string')
  if (typeof reason !== 'string' || reason.trim() === '')
    throw new ConfigError(`disable reason must not be empty (${code})`)
  return { code, reason }
}

export const disableEntriesFrom = (
  raw: unknown,
  schemaVersion: 1 | 2,
): DisableEntry[] => {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) throw new ConfigError('disable must be a list')
  return raw.map((entry) => entryFrom(entry, schemaVersion))
}
```

`entryFrom` is a non-exported top-level function: the house lint forbids that.
Put it in `src/config/disableEntryFrom.ts` as an export and import it.

```ts
// src/config/isDisabled.ts
import type { DisableEntry } from '@/config/DisableEntry.js'

export const isDisabled = (code: string, disabled: DisableEntry[]): boolean =>
  disabled.some((entry) => entry.code === code)
```

```ts
// src/config/legacyConfigNotice.ts
import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'

/** One line for stderr when the file predates the strict mode; nothing under schemaVersion 2. */
export const legacyConfigNotice = (
  config: DbQualityConfig,
): string | undefined =>
  config.schemaVersion === 1
    ? `${CONFIG_FILENAME} is schemaVersion 1; "codeality-db init --apply" upgrades it to 2 and asks a reason for every disabled rule`
    : undefined
```

In `configFromDocument.ts`: replace the `schemaVersion !== 1` check with

```ts
  const schemaVersion = raw['schemaVersion']
  if (schemaVersion !== 1 && schemaVersion !== 2)
    throw new ConfigError('schemaVersion must be 1 or 2')
  ...
  return {
    schemaVersion,
    ...stackSectionsFrom(raw),
    audit: auditSectionFrom(configSection(raw, 'audit')),
    disable: disableEntriesFrom(raw['disable'], schemaVersion),
  }
```

`DbQualityConfig`: `schemaVersion: 1 | 2`, `disable: DisableEntry[]`.
`Severity`: `'error' | 'warn'`. `rlsEnabledNoPolicy.severity = 'warn'`;
`parseIndexStats` severity `'warn' as const`. Fix every `disabled: string[]`
parameter to `DisableEntry[]` (`runSqlRules`, `runSquawk`, `runPrismaLint`,
`runDrizzleLint`, `runSqliteChecks`, `parseAdvisorReport`, `parseIndexStats`,
`parseBloat`, `runSoda`, `runAdvisors`, `runInspect`); the tests that passed
`[]` keep working, the ones that passed `['BDB001']` become
`[{ code: 'BDB001', reason: 'test' }]`.

In `checkCommand`, `auditCommand`, `gateCommand`, `baselineCommand`: after
`readConfig`,
`const notice = legacyConfigNotice(config); if (notice) io.stderr(`${notice}\n`)`.
Test in `tests/commands/checkCommand.test.ts`: a `schemaVersion: 1` file prints
the notice to stderr and still exits by findings.

- [ ] **Step 4: Run** — `pnpm test`, `pnpm lint`, `pnpm type-check` green.
      Coverage stays over thresholds.

- [ ] **Step 5: Commit** —
      `git commit -m "feat(db-quality)!: every finding blocks, disabled rules carry a reason"`.

---

### Task 2: `postgrest` and `perf` configuration sections

**Files:**

- Create: `src/config/PerfConfig.ts`, `src/config/PERF_DEFAULTS.ts`,
  `src/config/perfSectionFrom.ts`, `src/config/postgrestSectionFrom.ts`,
  `src/config/ROLE_NAME_PATTERN.ts`
- Modify: `src/config/DbQualityConfig.ts`, `src/config/CONFIG_KEYS.ts`,
  `src/config/configFromDocument.ts`, `src/config/detectStacks.ts`,
  `src/config/StackSections.ts`
- Test: `tests/config/perfSectionFrom.test.ts`,
  `tests/config/postgrestSectionFrom.test.ts`,
  `tests/config/detectStacks.test.ts` (extend)

**Interfaces:**

- Produces:

```ts
export type PerfConfig = {
  inGate: boolean
  slowMs: number
  regressionPercent: number
  minCalls: number
  seqScanRows: number
  benchDir: string
  benchRuns: number
  benchTimeoutMs: number
  roles: string[]
  ignore: string[]
}
```

`DbQualityConfig.perf: PerfConfig` (always present, defaults filled),
`DbQualityConfig.postgrest?: { roots: string[] }`, `PERF_DEFAULTS: PerfConfig`
with `inGate: true`, `slowMs: 100`, `regressionPercent: 20`, `minCalls: 20`,
`seqScanRows: 10000`, `benchDir: 'db-quality/bench'`, `benchRuns: 5`,
`benchTimeoutMs: 60000`, `roles: ['authenticator', 'service_role', 'postgres']`,
`ignore: []`. `detectStacks` returns `postgrest` when `package.json` lists
`@supabase/supabase-js` in `dependencies` or `devDependencies`, roots among
`src`, `app`, `supabase/functions` that exist.

- [ ] **Step 1: Failing tests**

```ts
// tests/config/perfSectionFrom.test.ts
import { describe, expect, it } from 'vitest'

import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import { perfSectionFrom } from '@/config/perfSectionFrom.js'

describe('perfSectionFrom', () => {
  it('fills every default when the section is absent', () => {
    expect(perfSectionFrom(undefined)).toEqual(PERF_DEFAULTS)
  })
  it('overrides one key and keeps the rest', () => {
    expect(perfSectionFrom({ slowMs: 250, inGate: false })).toEqual({
      ...PERF_DEFAULTS,
      slowMs: 250,
      inGate: false,
    })
  })
  it('rejects a role name that is not an identifier', () => {
    expect(() => perfSectionFrom({ roles: ['postgres; drop'] })).toThrow(
      /perf.roles entries must match/,
    )
  })
  it('rejects wrong types', () => {
    expect(() => perfSectionFrom({ minCalls: '20' })).toThrow(
      /perf.minCalls must be a number/,
    )
    expect(() => perfSectionFrom({ ignore: [1] })).toThrow(
      /perf.ignore must be a list of strings/,
    )
    expect(() => perfSectionFrom({ benchDir: 3 })).toThrow(
      /perf.benchDir must be a string/,
    )
  })
})
```

```ts
// tests/config/postgrestSectionFrom.test.ts
import { describe, expect, it } from 'vitest'

import { postgrestSectionFrom } from '@/config/postgrestSectionFrom.js'

describe('postgrestSectionFrom', () => {
  it('needs a non-empty list of roots', () => {
    expect(postgrestSectionFrom({ roots: ['src'] })).toEqual({ roots: ['src'] })
    expect(() => postgrestSectionFrom({ roots: [] })).toThrow(
      /postgrest.roots must name at least one directory/,
    )
    expect(() => postgrestSectionFrom({})).toThrow(
      /postgrest.roots must be a list of strings/,
    )
  })
})
```

Extend `tests/config/detectStacks.test.ts`: a temp root with `package.json`
`{"dependencies":{"@supabase/supabase-js":"^2"}}` and directories `src` and
`app` yields `postgrest: { roots: ['src', 'app'] }`; without the dependency, no
`postgrest` key.

- [ ] **Step 2: Run, expect failures.**

- [ ] **Step 3: Implement**

```ts
// src/config/ROLE_NAME_PATTERN.ts
/** A Postgres role name that can be interpolated into a query without quoting. */
export const ROLE_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/
```

```ts
// src/config/perfSectionFrom.ts
import { ConfigError } from '@/config/ConfigError.js'
import { expectConfig } from '@/config/expectConfig.js'
import { isStringList } from '@/config/isStringList.js'
import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import type { PerfConfig } from '@/config/PerfConfig.js'
import { ROLE_NAME_PATTERN } from '@/config/ROLE_NAME_PATTERN.js'

export const perfSectionFrom = (
  raw: Record<string, unknown> | undefined,
): PerfConfig => {
  const merged: Record<string, unknown> = { ...PERF_DEFAULTS, ...raw }
  for (const key of [
    'slowMs',
    'regressionPercent',
    'minCalls',
    'seqScanRows',
    'benchRuns',
    'benchTimeoutMs',
  ])
    expectConfig(
      typeof merged[key] === 'number',
      `perf.${key} must be a number`,
    )
  expectConfig(
    typeof merged['inGate'] === 'boolean',
    'perf.inGate must be a boolean',
  )
  expectConfig(
    typeof merged['benchDir'] === 'string',
    'perf.benchDir must be a string',
  )
  expectConfig(
    isStringList(merged['roles']),
    'perf.roles must be a list of strings',
  )
  expectConfig(
    isStringList(merged['ignore']),
    'perf.ignore must be a list of strings',
  )
  const roles = merged['roles'] as string[]
  const bad = roles.find((role) => !ROLE_NAME_PATTERN.test(role))
  if (bad !== undefined)
    throw new ConfigError(
      `perf.roles entries must match ${ROLE_NAME_PATTERN.source}: "${bad}"`,
    )
  return merged as PerfConfig
}
```

Check `expectConfig`'s signature in `src/config/expectConfig.ts` (it throws
`ConfigError` when the condition is false) and use it as it is.

```ts
// src/config/postgrestSectionFrom.ts
import { ConfigError } from '@/config/ConfigError.js'
import { isStringList } from '@/config/isStringList.js'

export const postgrestSectionFrom = (
  raw: Record<string, unknown>,
): { roots: string[] } => {
  const roots = raw['roots']
  if (!isStringList(roots))
    throw new ConfigError('postgrest.roots must be a list of strings')
  if (roots.length === 0)
    throw new ConfigError('postgrest.roots must name at least one directory')
  return { roots }
}
```

`{ roots: string[] }` inline in a runtime file trips
`no-inline-types-in-runtime-files`: declare
`export type PostgrestConfig = { roots: string[] }` in
`src/config/PostgrestConfig.ts` and use it here and in `DbQualityConfig`.

`configFromDocument`: add `perf: perfSectionFrom(configSection(raw, 'perf'))`
and, when `configSection(raw, 'postgrest')` is present,
`postgrest: postgrestSectionFrom(...)`. `CONFIG_KEYS` gains `'postgrest'` and
`'perf'`. `StackSections` adds `'postgrest'`; `stackSectionsFrom` handles it (so
`detectStacks`' return type still fits).

`detectStacks`: read `package.json` if present,
`const manifest = JSON.parse(...) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }`
(declare `PackageManifest` type in `src/config/PackageManifest.ts`),
`hasSupabaseJs = '@supabase/supabase-js' in {...deps, ...devDeps}`; roots
`['src', 'app', 'supabase/functions'].filter(isDirectory)`; add
`postgrest: { roots }` when `hasSupabaseJs && roots.length > 0`.

- [ ] **Step 4: Run** — green, lint clean.

- [ ] **Step 5: Commit** —
      `feat(db-quality): postgrest and perf configuration sections`.

---

### Task 3: Index knowledge from the migration set

**Files:**

- Create: `src/rules/TableKnowledge.ts`, `src/rules/indexedColumns.ts`,
  `src/rules/leadingColumn.ts`, `src/rules/inlineKeyColumns.ts`
- Test: `tests/rules/indexedColumns.test.ts`, fixture
  `tests/fixtures/migrations/indexes.sql`

**Interfaces:**

- Consumes: `MigrationFile[]`, `normalizeSqlText`, `qualifiedName`,
  `createdTables`.
- Produces:
  `type TableKnowledge = { indexed: Set<string>; unique: Set<string> }` (column
  names, lower case; `unique` is a subset of `indexed` and holds primary-key and
  unique leading columns);
  `indexedColumns(set: MigrationFile[]): Map<string, TableKnowledge>` keyed by
  qualified table name, with an entry for every table `createdTables` knows,
  even when empty.

- [ ] **Step 1: Fixture and failing test**

```sql
-- tests/fixtures/migrations/indexes.sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  email text unique,
  status text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, status)
);
create index orders_created_at_idx on public.orders (created_at desc);
create unique index if not exists orders_status_lower on public.orders (lower(status));
create table public.notes (id bigint generated always as identity, body text, primary key (id));
alter table public.notes add constraint notes_body_key unique (body);
create index concurrently notes_body_trgm on public.notes using gin (body gin_trgm_ops);
create table "public"."Quoted" ("Id" int primary key, "ownerId" uuid);
create index on public."Quoted" ("ownerId");
```

```ts
// tests/rules/indexedColumns.test.ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { indexedColumns } from '@/rules/indexedColumns.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const sql = readFileSync(
  new URL('../fixtures/migrations/indexes.sql', import.meta.url),
  'utf8',
)

describe('indexedColumns', () => {
  const knowledge = indexedColumns(migrationSetFrom({ 'm/a.sql': sql }))
  it('collects inline keys, table constraints, create index and alter table', () => {
    const orders = knowledge.get('public.orders')
    expect([...(orders?.indexed ?? [])].sort()).toEqual([
      'created_at',
      'email',
      'id',
      'organization_id',
    ])
    expect([...(orders?.unique ?? [])].sort()).toEqual([
      'email',
      'id',
      'organization_id',
    ])
  })
  it('ignores expression indexes and records gin indexes by their column', () => {
    const notes = knowledge.get('public.notes')
    expect([...(notes?.indexed ?? [])].sort()).toEqual(['body', 'id'])
    expect([...(notes?.unique ?? [])].sort()).toEqual(['body', 'id'])
  })
  it('lower-cases quoted identifiers', () => {
    const quoted = knowledge.get('public.quoted')
    expect([...(quoted?.indexed ?? [])].sort()).toEqual(['id', 'ownerid'])
  })
  it('knows a created table with no index at all', () => {
    const set = migrationSetFrom({
      'm/b.sql': 'create table public.bare (a int);',
    })
    expect(indexedColumns(set).get('public.bare')).toEqual({
      indexed: new Set(),
      unique: new Set(),
    })
  })
})
```

- [ ] **Step 2: Run, expect failure** (module missing).

- [ ] **Step 3: Implement**

```ts
// src/rules/TableKnowledge.ts
/** What the migrations say about a table's access paths: every indexed leading column, and the unique ones among them. */
export type TableKnowledge = { indexed: Set<string>; unique: Set<string> }
```

```ts
// src/rules/leadingColumn.ts
/** The first column of a parenthesised column list, or undefined when it is an expression. */
export const leadingColumn = (list: string): string | undefined => {
  const first = list.split(',')[0]?.trim() ?? ''
  const match =
    /^(?:"([^"]+)"|([a-z_][\w$]*))(?:\s+(?:asc|desc|nulls|[a-z_]+_ops)\b.*)?$/i.exec(
      first,
    )
  if (!match) return undefined
  return (match[1] ?? match[2] ?? '').toLowerCase()
}
```

```ts
// src/rules/inlineKeyColumns.ts
/** Columns declared `primary key` or `unique` inside a create table body, plus its table-level constraints. */
export const inlineKeyColumns = (body: string): string[] => {
  const columns: string[] = []
  for (const part of body.split(/,(?![^(]*\))/)) {
    const item = part.trim()
    const constraint =
      /^(?:constraint\s+\S+\s+)?(?:primary key|unique)\s*\(([^)]*)\)/i.exec(
        item,
      )
    if (constraint?.[1]) {
      const head = constraint[1]
        .split(',')[0]
        ?.trim()
        .replaceAll('"', '')
        .toLowerCase()
      if (head) columns.push(head)
      continue
    }
    const column =
      /^(?:"([^"]+)"|([a-z_][\w$]*))\s+[^,]*\b(?:primary key|unique)\b/i.exec(
        item,
      )
    if (column) columns.push((column[1] ?? column[2] ?? '').toLowerCase())
  }
  return columns
}
```

```ts
// src/rules/indexedColumns.ts
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { createdTables } from '@/rules/createdTables.js'
import { inlineKeyColumns } from '@/rules/inlineKeyColumns.js'
import { leadingColumn } from '@/rules/leadingColumn.js'
import type { TableKnowledge } from '@/rules/TableKnowledge.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import { qualifiedName } from '@/sql/qualifiedName.js'

const NAME = String.raw`((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)`
const CREATE_TABLE = new RegExp(
  String.raw`^create (?:unlogged |temp(?:orary)? )?table (?:if not exists )?${NAME}\s*\(([\s\S]*)\)`,
)
const CREATE_INDEX = new RegExp(
  String.raw`^create (unique )?index (?:concurrently )?(?:if not exists )?(?:\S+ )?on (?:only )?${NAME}(?: using \w+)?\s*\(([^)]*)\)`,
)
const ALTER_KEY = new RegExp(
  String.raw`^alter table (?:if exists )?(?:only )?${NAME} add (?:constraint \S+ )?(primary key|unique)\s*\(([^)]*)\)`,
)

export const indexedColumns = (
  set: MigrationFile[],
): Map<string, TableKnowledge> => {
  const knowledge = new Map<string, TableKnowledge>()
  const entry = (table: string): TableKnowledge => {
    const existing = knowledge.get(table)
    if (existing) return existing
    const fresh = { indexed: new Set<string>(), unique: new Set<string>() }
    knowledge.set(table, fresh)
    return fresh
  }
  for (const table of createdTables(set).keys()) entry(table)
  for (const file of set)
    for (const statement of file.statements) {
      const text = normalizeSqlText(statement.text)
      const created = CREATE_TABLE.exec(text)
      if (created?.[1] && created[2] !== undefined) {
        const table = entry(qualifiedName(created[1]))
        for (const column of inlineKeyColumns(created[2])) {
          table.indexed.add(column)
          table.unique.add(column)
        }
        continue
      }
      const index = CREATE_INDEX.exec(text)
      if (index?.[2] && index[3] !== undefined) {
        const column = leadingColumn(index[3])
        if (column === undefined) continue
        const table = entry(qualifiedName(index[2]))
        table.indexed.add(column)
        if (index[1]) table.unique.add(column)
        continue
      }
      const altered = ALTER_KEY.exec(text)
      if (altered?.[1] && altered[3] !== undefined) {
        const column = leadingColumn(altered[3])
        if (column === undefined) continue
        const table = entry(qualifiedName(altered[1]))
        table.indexed.add(column)
        table.unique.add(column)
      }
    }
  return knowledge
}
```

The three regular expressions and `NAME` are hidden top-level constants: move
each into its own file under `src/rules/` (`INDEX_NAME_PATTERN.ts`,
`CREATE_TABLE_PATTERN.ts`, `CREATE_INDEX_PATTERN.ts`, `ALTER_KEY_PATTERN.ts`).
`security/detect-non-literal-regexp` warns on `new RegExp(String.raw...)`: write
the three patterns as literal regexes (repeat the name group inline) so the
warning does not fire. `normalizeSqlText` lower-cases and collapses whitespace
(check `src/model/normalizeSqlText.ts`); if it strips newlines the `[\s\S]*`
still matches. The function is over `complexity` 10: split the three branches
into `recordCreateTable`, `recordCreateIndex`, `recordAlterKey` files, each
`(text: string, entry: (table: string) => TableKnowledge) => boolean`.

- [ ] **Step 4: Run** — green.

- [ ] **Step 5: Commit** —
      `feat(db-quality): read the index knowledge the migrations carry`.

---

### Task 4: Collect PostgREST query chains from TypeScript sources

**Files:**

- Create: `src/postgrest/PostgrestCall.ts`, `src/postgrest/PostgrestChain.ts`,
  `src/postgrest/literalArgument.ts`, `src/postgrest/isInnerCall.ts`,
  `src/postgrest/isIterationCallback.ts`, `src/postgrest/isInsideLoop.ts`,
  `src/postgrest/chainFromCall.ts`, `src/postgrest/collectPostgrestChains.ts`,
  `src/postgrest/ITERATION_METHODS.ts`
- Modify: `package.json` (peer `typescript >=5`, optional; dev dependency
  already present as the aliased `typescript`), `eslint.config.ts` if the
  `typescript` default import needs `import ts from 'typescript'` allowed (it
  does under the base config)
- Test: `tests/postgrest/collectPostgrestChains.test.ts`, fixtures
  `tests/fixtures/postgrest/chains.ts`, `tests/fixtures/postgrest/loops.tsx`

**Interfaces:**

- Produces:

```ts
export type PostgrestCall = { name: string; args: string[] }
export type PostgrestChain = {
  path: string
  line: number
  root: 'from' | 'rpc'
  target: string
  calls: PostgrestCall[]
  inLoop: boolean
  text: string
}
export const collectPostgrestChains = (path: string, source: string): PostgrestChain[]
```

`args` hold string literals verbatim, object literals as `{key:value,...}` with
literal values (`{count:exact,head:true}`), anything else as `?`. `calls`
excludes the root call. `line` is the 1-based line of the `.from(`/`.rpc(` call.
`text` is the whole chain's source with whitespace collapsed to single spaces.

- [ ] **Step 1: Fixtures and failing test**

```ts
// tests/fixtures/postgrest/chains.ts
declare const supabase: {
  from: (table: string) => any
  rpc: (fn: string, args?: unknown) => any
}
declare const table: string

export const listAll = async () => supabase.from('orders').select('*')

export const listSome = async () =>
  supabase
    .from('orders')
    .select('id, status', { count: 'exact' })
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(20)

export const one = async () =>
  supabase.from('orders').select('id').eq('id', 'x').maybeSingle()

export const dynamic = async () => supabase.from(table).select('id')

export const call = async () => supabase.rpc('reap_jobs', { limit: 5 })

export const write = async () =>
  supabase.from('orders').update({ status: 'closed' }).eq('id', 'x')
```

```tsx
// tests/fixtures/postgrest/loops.tsx
declare const supabase: { from: (table: string) => any }
declare const ids: string[]

export const inFor = async () => {
  for (const id of ids) {
    await supabase.from('orders').select('id').eq('id', id)
  }
}

export const inMap = () =>
  Promise.all(
    ids.map((id) => supabase.from('orders').select('id').eq('id', id)),
  )

export const helper = () => {
  const load = () => supabase.from('orders').select('id').limit(1)
  return load
}

export const Component = () => <div>{ids.length}</div>
```

```ts
// tests/postgrest/collectPostgrestChains.test.ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { collectPostgrestChains } from '@/postgrest/collectPostgrestChains.js'

const fixture = (name: string): string =>
  readFileSync(
    new URL(`../fixtures/postgrest/${name}`, import.meta.url),
    'utf8',
  )

describe('collectPostgrestChains', () => {
  const chains = collectPostgrestChains('src/chains.ts', fixture('chains.ts'))
  it('finds every chain rooted at from or rpc with a literal target', () => {
    expect(chains.map((c) => [c.root, c.target])).toEqual([
      ['from', 'orders'],
      ['from', 'orders'],
      ['from', 'orders'],
      ['rpc', 'reap_jobs'],
      ['from', 'orders'],
    ])
  })
  it('records the calls after the root with their literal arguments', () => {
    expect(chains[1]?.calls).toEqual([
      { name: 'select', args: ['id, status', '{count:exact}'] },
      { name: 'eq', args: ['status', 'open'] },
      { name: 'order', args: ['created_at', '{ascending:false}'] },
      { name: 'limit', args: ['?'] },
    ])
  })
  it('points at the line of the from call and keeps the chain text', () => {
    expect(chains[0]?.line).toBe(7)
    expect(chains[0]?.text).toBe("supabase.from('orders').select('*')")
  })
  it('marks chains inside loops and iteration callbacks, not helpers', () => {
    const loops = collectPostgrestChains('src/loops.tsx', fixture('loops.tsx'))
    expect(loops.map((c) => c.inLoop)).toEqual([true, true, false])
  })
})
```

Note `limit(20)`: a numeric literal is not a string literal, so it is `?`. Keep
that: the rules only ever need strings and option objects.

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

```ts
// src/postgrest/ITERATION_METHODS.ts
export const ITERATION_METHODS = new Set([
  'map',
  'forEach',
  'reduce',
  'filter',
  'flatMap',
])
```

```ts
// src/postgrest/literalArgument.ts
import ts from 'typescript'

/** A string literal verbatim, an object literal as `{key:value}` pairs, anything else as `?`. */
export const literalArgument = (node: ts.Expression): string => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text
  if (!ts.isObjectLiteralExpression(node)) return '?'
  const pairs = node.properties.map((property) => {
    if (!ts.isPropertyAssignment(property)) return '?'
    const key =
      ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : '?'
    const value = property.initializer
    const text =
      ts.isStringLiteral(value) || ts.isNumericLiteral(value)
        ? value.text
        : value.kind === ts.SyntaxKind.TrueKeyword
          ? 'true'
          : value.kind === ts.SyntaxKind.FalseKeyword
            ? 'false'
            : '?'
    return `${key}:${text}`
  })
  return `{${pairs.join(',')}}`
}
```

```ts
// src/postgrest/isInnerCall.ts
import ts from 'typescript'

/** True when the call continues into a longer chain (`a.b().c()`: `b()` is inner, `c()` is not). */
export const isInnerCall = (node: ts.CallExpression): boolean =>
  ts.isPropertyAccessExpression(node.parent) &&
  ts.isCallExpression(node.parent.parent) &&
  node.parent.parent.expression === node.parent
```

```ts
// src/postgrest/isIterationCallback.ts
import ts from 'typescript'

import { ITERATION_METHODS } from '@/postgrest/ITERATION_METHODS.js'

export const isIterationCallback = (node: ts.Node): boolean =>
  (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
  ts.isCallExpression(node.parent) &&
  ts.isPropertyAccessExpression(node.parent.expression) &&
  ITERATION_METHODS.has(node.parent.expression.name.text)
```

```ts
// src/postgrest/isInsideLoop.ts
import ts from 'typescript'

import { isIterationCallback } from '@/postgrest/isIterationCallback.js'

/** Walks up to the enclosing function; a loop statement or an iteration callback on the way means the query runs once per item. */
export const isInsideLoop = (node: ts.Node): boolean => {
  let current: ts.Node | undefined = node.parent
  while (current && !ts.isSourceFile(current)) {
    if (ts.isIterationStatement(current, false)) return true
    if (isIterationCallback(current)) return true
    if (ts.isFunctionLike(current)) return false
    current = current.parent
  }
  return false
}
```

`ts.isIterationStatement(node, lookInLabeledStatements)` covers `for`, `for of`,
`for in`, `while`, `do`.

```ts
// src/postgrest/chainFromCall.ts
import ts from 'typescript'

import { isInsideLoop } from '@/postgrest/isInsideLoop.js'
import { literalArgument } from '@/postgrest/literalArgument.js'
import type { PostgrestCall } from '@/postgrest/PostgrestCall.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'

/** The chain ending at `outer`, or undefined when no `.from('x')`/`.rpc('f')` with a literal sits in it. */
export const chainFromCall = (
  outer: ts.CallExpression,
  file: ts.SourceFile,
  path: string,
): PostgrestChain | undefined => {
  const calls: { name: string; args: string[]; node: ts.CallExpression }[] = []
  let current: ts.Expression = outer
  while (
    ts.isCallExpression(current) &&
    ts.isPropertyAccessExpression(current.expression)
  ) {
    calls.unshift({
      name: current.expression.name.text,
      args: current.arguments.map(literalArgument),
      node: current,
    })
    current = current.expression.expression
  }
  const rootIndex = calls.findIndex(
    (call) =>
      (call.name === 'from' || call.name === 'rpc') &&
      call.args[0] !== undefined &&
      call.args[0] !== '?',
  )
  const root = calls[rootIndex]
  if (!root) return undefined
  const rest: PostgrestCall[] = calls
    .slice(rootIndex + 1)
    .map(({ name, args }) => ({ name, args }))
  return {
    path,
    line: file.getLineAndCharacterOfPosition(root.node.getStart(file)).line + 1,
    root: root.name as 'from' | 'rpc',
    target: root.args[0] ?? '',
    calls: rest,
    inLoop: isInsideLoop(outer),
    text: outer.getText(file).replaceAll(/\s+/g, ' '),
  }
}
```

The local tuple type `{ name; args; node }` is an inline type in a runtime file:
declare
`export type CollectedCall = PostgrestCall & { node: ts.CallExpression }` in
`src/postgrest/CollectedCall.ts`.

```ts
// src/postgrest/collectPostgrestChains.ts
import ts from 'typescript'

import { chainFromCall } from '@/postgrest/chainFromCall.js'
import { isInnerCall } from '@/postgrest/isInnerCall.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'

export const collectPostgrestChains = (
  path: string,
  source: string,
): PostgrestChain[] => {
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const chains: PostgrestChain[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && !isInnerCall(node)) {
      const chain = chainFromCall(node, file, path)
      if (chain) chains.push(chain)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return chains
}
```

`package.json`: add `"typescript": ">=5.0.0"` to `peerDependencies` with
`peerDependenciesMeta.typescript.optional: true` (the check runs without it when
`postgrest` is not configured; `runPostgrestRules` catches the missing module
and throws
`ToolMissingError('typescript', 'install typescript in the project')`, see Task
5). tsup marks peers external, so `dist/cli.js` resolves `typescript` from the
adopter's `node_modules` at run time. Verify after `pnpm build`:
`grep -c "from \"typescript\"\|from 'typescript'" dist/cli.js` is `1` and the
bundle did not inline the compiler (size stays under 200 KB).

- [ ] **Step 4: Run** — green; `pnpm build` and the grep above.

- [ ] **Step 5: Commit** —
      `feat(db-quality): collect PostgREST query chains from TypeScript sources`.

---

### Task 5: The five PostgREST rules in `check`

**Files:**

- Create: `src/postgrest/PostgrestRule.ts`,
  `src/postgrest/makePostgrestFinding.ts`, `src/postgrest/FILTER_METHODS.ts`,
  `src/postgrest/BOUNDING_METHODS.ts`, `src/postgrest/selectCall.ts`,
  `src/postgrest/isBounded.ts`, `src/postgrest/selectStar.ts`,
  `src/postgrest/unboundedList.ts`, `src/postgrest/filterWithoutIndex.ts`,
  `src/postgrest/queryInLoop.ts`, `src/postgrest/exactCountUnbounded.ts`,
  `src/postgrest/POSTGREST_RULES.ts`, `src/postgrest/RuleContext.ts`,
  `src/postgrest/sourceFilesUnder.ts`, `src/postgrest/SKIPPED_SOURCE_DIRS.ts`,
  `src/postgrest/runPostgrestRules.ts`
- Modify: `src/check/runCheck.ts`
- Test: `tests/postgrest/rules.test.ts`,
  `tests/postgrest/sourceFilesUnder.test.ts`,
  `tests/postgrest/runPostgrestRules.test.ts`, `tests/check/runCheck.test.ts`
  (extend)

**Interfaces:**

- Consumes: `PostgrestChain`, `TableKnowledge`, `indexedColumns`,
  `readMigrationSet`, `fingerprintFinding`, `isDisabled`.
- Produces:

```ts
export type RuleContext = { knowledge: Map<string, TableKnowledge> }
export type PostgrestRule = {
  code: string
  name: string
  severity: Severity
  run: (chain: PostgrestChain, context: RuleContext) => Finding | undefined
}
export const runPostgrestRules = (
  root: string,
  roots: string[],
  knowledge: Map<string, TableKnowledge>,
  disabled: DisableEntry[],
): Finding[]
```

`FILTER_METHODS = new Set(['eq','neq','gt','gte','lt','lte','like','ilike','is','in','contains','containedBy','overlaps','textSearch'])`.
`BOUNDING_METHODS = new Set(['limit','range','single','maybeSingle','csv'])`. A
chain "reads" when its first call after the root is `select`.
`isBounded(chain, knowledge)` is true when any bounding method is present, when
the select options contain `head:true`, or when an `eq` targets a column in
`knowledge.unique` of the chain's table.

- [ ] **Step 1: Failing rule tests**

```ts
// tests/postgrest/rules.test.ts
import { describe, expect, it } from 'vitest'

import { exactCountUnbounded } from '@/postgrest/exactCountUnbounded.js'
import { filterWithoutIndex } from '@/postgrest/filterWithoutIndex.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'
import { queryInLoop } from '@/postgrest/queryInLoop.js'
import { selectStar } from '@/postgrest/selectStar.js'
import { unboundedList } from '@/postgrest/unboundedList.js'

const context = {
  knowledge: new Map([
    [
      'public.orders',
      { indexed: new Set(['id', 'status']), unique: new Set(['id']) },
    ],
  ]),
}
const chain = (
  calls: PostgrestChain['calls'],
  extra: Partial<PostgrestChain> = {},
): PostgrestChain => ({
  path: 'src/a.ts',
  line: 3,
  root: 'from',
  target: 'orders',
  calls,
  inLoop: false,
  text: 'supabase.from("orders")',
  ...extra,
})

describe('PostgREST rules', () => {
  it('BDB801 flags a star anywhere in the select list, not on rpc', () => {
    expect(
      selectStar.run(chain([{ name: 'select', args: ['*'] }]), context)?.code,
    ).toBe('BDB801')
    expect(
      selectStar.run(chain([{ name: 'select', args: [] }]), context)?.code,
    ).toBe('BDB801')
    expect(
      selectStar.run(
        chain([{ name: 'select', args: ['id, profile(*)'] }]),
        context,
      )?.subject,
    ).toBe('orders')
    expect(
      selectStar.run(chain([{ name: 'select', args: ['id'] }]), context),
    ).toBeUndefined()
    expect(
      selectStar.run(
        chain([{ name: 'select', args: ['*'] }], { root: 'rpc', target: 'f' }),
        context,
      ),
    ).toBeUndefined()
  })
  it('BDB802 flags a read with no bound and no unique equality', () => {
    expect(
      unboundedList.run(chain([{ name: 'select', args: ['id'] }]), context)
        ?.code,
    ).toBe('BDB802')
    expect(
      unboundedList.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'limit', args: ['?'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      unboundedList.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['id', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      unboundedList.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['status', 'x'] },
        ]),
        context,
      )?.code,
    ).toBe('BDB802')
    expect(
      unboundedList.run(
        chain([{ name: 'select', args: ['id', '{head:true,count:exact}'] }]),
        context,
      ),
    ).toBeUndefined()
    expect(
      unboundedList.run(
        chain([
          { name: 'update', args: ['?'] },
          { name: 'eq', args: ['id', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      unboundedList.run(
        chain([{ name: 'select', args: ['id'] }], { target: 'unknown_view' }),
        context,
      ),
    ).toBeUndefined()
  })
  it('BDB803 flags a literal filter column without an index, on known tables only', () => {
    const finding = filterWithoutIndex.run(
      chain([
        { name: 'select', args: ['id'] },
        { name: 'eq', args: ['email', 'x'] },
      ]),
      context,
    )
    expect(finding?.code).toBe('BDB803')
    expect(finding?.subject).toBe('orders.email')
    expect(
      filterWithoutIndex.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['status', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      filterWithoutIndex.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['profile.id', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      filterWithoutIndex.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['?', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      filterWithoutIndex.run(
        chain(
          [
            { name: 'select', args: ['id'] },
            { name: 'eq', args: ['email', 'x'] },
          ],
          { target: 'v' },
        ),
        context,
      ),
    ).toBeUndefined()
  })
  it('BDB804 flags any chain inside a loop', () => {
    expect(
      queryInLoop.run(
        chain([{ name: 'select', args: ['id'] }], { inLoop: true }),
        context,
      )?.code,
    ).toBe('BDB804')
    expect(
      queryInLoop.run(chain([{ name: 'select', args: ['id'] }]), context),
    ).toBeUndefined()
  })
  it('BDB805 flags an exact count with no bound', () => {
    expect(
      exactCountUnbounded.run(
        chain([{ name: 'select', args: ['id', '{count:exact}'] }]),
        context,
      )?.code,
    ).toBe('BDB805')
    expect(
      exactCountUnbounded.run(
        chain([
          { name: 'select', args: ['id', '{count:exact}'] },
          { name: 'range', args: ['?', '?'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      exactCountUnbounded.run(
        chain([{ name: 'select', args: ['id', '{count:exact,head:true}'] }]),
        context,
      ),
    ).toBeUndefined()
  })
  it('fingerprints on the chain text, not the line', () => {
    const a = selectStar.run(chain([{ name: 'select', args: ['*'] }]), context)
    const b = selectStar.run(
      chain([{ name: 'select', args: ['*'] }], { line: 99 }),
      context,
    )
    expect(a?.fingerprint).toBe(b?.fingerprint)
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

```ts
// src/postgrest/makePostgrestFinding.ts
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const makePostgrestFinding = (
  rule: Pick<PostgrestRule, 'code' | 'severity'>,
  chain: PostgrestChain,
  subject: string,
  message: string,
): Finding => {
  const partial = {
    code: rule.code,
    severity: rule.severity,
    path: chain.path,
    line: chain.line,
    message,
    subject,
  }
  return { ...partial, fingerprint: fingerprintFinding(partial, chain.text) }
}
```

```ts
// src/postgrest/selectCall.ts
import type { PostgrestCall } from '@/postgrest/PostgrestCall.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'

/** The `select` call when the chain is a read (select first after the root); undefined for writes and rpc. */
export const selectCall = (
  chain: PostgrestChain,
): PostgrestCall | undefined => {
  const first = chain.calls[0]
  return chain.root === 'from' && first?.name === 'select' ? first : undefined
}
```

```ts
// src/postgrest/isBounded.ts
import { BOUNDING_METHODS } from '@/postgrest/BOUNDING_METHODS.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'
import type { RuleContext } from '@/postgrest/RuleContext.js'
import { selectCall } from '@/postgrest/selectCall.js'

export const isBounded = (
  chain: PostgrestChain,
  context: RuleContext,
): boolean => {
  if (chain.calls.some((call) => BOUNDING_METHODS.has(call.name))) return true
  if (selectCall(chain)?.args[1]?.includes('head:true')) return true
  const unique = context.knowledge.get(`public.${chain.target}`)?.unique
  return chain.calls.some(
    (call) =>
      call.name === 'eq' &&
      call.args[0] !== undefined &&
      unique?.has(call.args[0].toLowerCase()) === true,
  )
}
```

```ts
// src/postgrest/selectStar.ts
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'
import { selectCall } from '@/postgrest/selectCall.js'

export const selectStar: PostgrestRule = {
  code: 'BDB801',
  name: 'select-star',
  severity: 'warn',
  run: (chain) => {
    const select = selectCall(chain)
    if (!select) return undefined
    const list = select.args[0]
    if (list !== undefined && list !== '?' && !list.includes('*'))
      return undefined
    if (list === '?') return undefined
    return makePostgrestFinding(
      selectStar,
      chain,
      chain.target,
      'select fetches every column: name the columns the caller reads, so a new wide column never travels for free',
    )
  },
}
```

```ts
// src/postgrest/unboundedList.ts
import { isBounded } from '@/postgrest/isBounded.js'
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'
import { selectCall } from '@/postgrest/selectCall.js'

export const unboundedList: PostgrestRule = {
  code: 'BDB802',
  name: 'unbounded-list',
  severity: 'warn',
  run: (chain, context) => {
    if (!selectCall(chain) || !context.knowledge.has(`public.${chain.target}`))
      return undefined
    if (isBounded(chain, context)) return undefined
    return makePostgrestFinding(
      unboundedList,
      chain,
      chain.target,
      'read has no limit, range, single or unique-key equality: it returns the whole table as it grows',
    )
  },
}
```

```ts
// src/postgrest/filterWithoutIndex.ts
import { FILTER_METHODS } from '@/postgrest/FILTER_METHODS.js'
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const filterWithoutIndex: PostgrestRule = {
  code: 'BDB803',
  name: 'filter-without-index',
  severity: 'warn',
  run: (chain, context) => {
    if (chain.root !== 'from') return undefined
    const knowledge = context.knowledge.get(`public.${chain.target}`)
    if (!knowledge) return undefined
    const filter = chain.calls.find(
      (call) =>
        FILTER_METHODS.has(call.name) &&
        call.args[0] !== undefined &&
        call.args[0] !== '?' &&
        !call.args[0].includes('.') &&
        !knowledge.indexed.has(call.args[0].toLowerCase()),
    )
    if (!filter) return undefined
    const column = filter.args[0] ?? ''
    return makePostgrestFinding(
      filterWithoutIndex,
      chain,
      `${chain.target}.${column}`,
      `${filter.name}('${column}') filters a column no migration indexes: a sequential scan on every call`,
    )
  },
}
```

```ts
// src/postgrest/queryInLoop.ts
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'

export const queryInLoop: PostgrestRule = {
  code: 'BDB804',
  name: 'query-in-loop',
  severity: 'warn',
  run: (chain) =>
    chain.inLoop
      ? makePostgrestFinding(
          queryInLoop,
          chain,
          chain.target,
          'query runs once per iteration: fetch the set with .in() or a join, or move the query out of the loop',
        )
      : undefined,
}
```

```ts
// src/postgrest/exactCountUnbounded.ts
import { makePostgrestFinding } from '@/postgrest/makePostgrestFinding.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'
import { selectCall } from '@/postgrest/selectCall.js'

export const exactCountUnbounded: PostgrestRule = {
  code: 'BDB805',
  name: 'exact-count-unbounded',
  severity: 'warn',
  run: (chain) => {
    const options = selectCall(chain)?.args[1] ?? ''
    if (!options.includes('count:exact') || options.includes('head:true'))
      return undefined
    if (
      chain.calls.some((call) => call.name === 'limit' || call.name === 'range')
    )
      return undefined
    return makePostgrestFinding(
      exactCountUnbounded,
      chain,
      chain.target,
      'count: exact with no limit or range counts and returns the whole table; use head: true for the count alone or bound the rows',
    )
  },
}
```

```ts
// src/postgrest/POSTGREST_RULES.ts
import { exactCountUnbounded } from '@/postgrest/exactCountUnbounded.js'
import { filterWithoutIndex } from '@/postgrest/filterWithoutIndex.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'
import { queryInLoop } from '@/postgrest/queryInLoop.js'
import { selectStar } from '@/postgrest/selectStar.js'
import { unboundedList } from '@/postgrest/unboundedList.js'

export const POSTGREST_RULES: PostgrestRule[] = [
  selectStar,
  unboundedList,
  filterWithoutIndex,
  queryInLoop,
  exactCountUnbounded,
]
```

```ts
// src/postgrest/SKIPPED_SOURCE_DIRS.ts
export const SKIPPED_SOURCE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  '__tests__',
  '__mocks__',
])
```

```ts
// src/postgrest/sourceFilesUnder.ts
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import { SKIPPED_SOURCE_DIRS } from '@/postgrest/SKIPPED_SOURCE_DIRS.js'

/** Every .ts/.tsx under the roots, relative to root, tests and declarations excluded, sorted. */
export const sourceFilesUnder = (root: string, roots: string[]): string[] => {
  const files: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_SOURCE_DIRS.has(entry.name) && !entry.name.startsWith('.'))
          walk(join(dir, entry.name))
        continue
      }
      const name = entry.name
      if (
        !/\.tsx?$/.test(name) ||
        name.endsWith('.d.ts') ||
        /\.(test|spec)\.tsx?$/.test(name)
      )
        continue
      files.push(relative(root, join(dir, name)))
    }
  }
  for (const base of roots) walk(join(root, base))
  return files.sort()
}
```

A missing root directory must be a `ConfigError`
(`postgrest.roots: "app" is not a directory`), checked before walking.

```ts
// src/postgrest/runPostgrestRules.ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { DisableEntry } from '@/config/DisableEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'
import { collectPostgrestChains } from '@/postgrest/collectPostgrestChains.js'
import { POSTGREST_RULES } from '@/postgrest/POSTGREST_RULES.js'
import { sourceFilesUnder } from '@/postgrest/sourceFilesUnder.js'
import type { TableKnowledge } from '@/rules/TableKnowledge.js'

export const runPostgrestRules = (
  root: string,
  roots: string[],
  knowledge: Map<string, TableKnowledge>,
  disabled: DisableEntry[],
): Finding[] => {
  const rules = POSTGREST_RULES.filter(
    (rule) => !isDisabled(rule.code, disabled),
  )
  const context = { knowledge }
  return sourceFilesUnder(root, roots)
    .flatMap((path) =>
      collectPostgrestChains(path, readFileSync(join(root, path), 'utf8')),
    )
    .flatMap((chain) => rules.map((rule) => rule.run(chain, context)))
    .filter((finding): finding is Finding => finding !== undefined)
    .sort(compareFindings)
}
```

`runCheck`: when `config.postgrest` is set,
`const set = config.supabase ? readMigrationSet(root, config.supabase.migrations) : []`
(reuse the set already read for the SQL rules; read once), then
`findings.push(...runPostgrestRules(root, config.postgrest.roots, indexedColumns(set), config.disable))`.
Without `supabase`, the knowledge map is empty and only `BDB801`, `BDB804`,
`BDB805` can fire, which is the honest result.

- [ ] **Step 4: Tests for the walker and the runner** —
      `tests/postgrest/sourceFilesUnder.test.ts` builds a `mkdtemp` tree with
      `src/a.ts`, `src/a.test.ts`, `src/types.d.ts`, `src/node_modules/x.ts`,
      `app/b.tsx`, `.hidden/c.ts` and expects `['app/b.tsx', 'src/a.ts']`; a
      missing root throws the `ConfigError`.
      `tests/postgrest/runPostgrestRules.test.ts` copies both fixtures into a
      temp root and asserts the code counts: `BDB801` 1, `BDB802` 2 (`listAll`
      and `dynamic` are... `dynamic` has no literal target so it is never a
      chain; `listAll` and `inMap`/`inFor` filter on the unique `id`... work the
      expected numbers out from the fixture and the knowledge
      `{ 'public.orders': { indexed: {'id'}, unique: {'id'} } }` passed
      directly: `listAll` gives `BDB801` and `BDB802`; `listSome` gives `BDB803`
      on `status`; `inFor` and `inMap` give `BDB804`; `helper` is clean). Extend
      `tests/check/runCheck.test.ts` with a config that has `postgrest` and no
      `supabase` and a source file with `select('*')`: one `BDB801`.

- [ ] **Step 5: Run** — green; lint clean (split anything over the limits into
      the files named above).

- [ ] **Step 6: Commit** —
      `feat(db-quality): five rules on the PostgREST query chains in application code`.

---

### Task 6: A read-only Postgres session through `psql`

**Files:**

- Create: `src/postgres/PostgresTarget.ts`,
  `src/postgres/PostgresTargetFlags.ts`, `src/postgres/POOLER_URL_FILE.ts`,
  `src/postgres/DB_PASSWORD_ENV.ts`, `src/postgres/resolvePostgresTarget.ts`,
  `src/postgres/requirePostgresTarget.ts`, `src/postgres/PsqlSession.ts`,
  `src/postgres/psqlSession.ts`, `src/postgres/psqlArguments.ts`
- Modify: `docs/superpowers/specs/2026-09-25-db-quality-perf-design.md`
  (Connection section: `psql` through the runner, session `SET`, the `PGOPTIONS`
  measurement)
- Test: `tests/postgres/resolvePostgresTarget.test.ts`,
  `tests/postgres/psqlSession.test.ts`,
  `tests/postgres/psqlSession.integration.test.ts`

**Interfaces:**

- Consumes: `CommandRunner`, `ToolMissingError`, `ConfigError`.
- Produces:

```ts
export type PostgresTarget = { url: string; host: string; password?: string }
export type PostgresTargetFlags = { 'db-url'?: string | undefined }
export const resolvePostgresTarget = (root: string, flags: PostgresTargetFlags): PostgresTarget | undefined
export const requirePostgresTarget = (root: string, flags: PostgresTargetFlags): PostgresTarget  // ConfigError when undefined
export type PsqlSession = {
  rows: (sql: string) => unknown[]      // wraps sql in json_agg, returns the parsed array
  text: (sql: string) => string         // raw stdout of one statement (EXPLAIN JSON)
}
export const psqlSession = (runner: CommandRunner, root: string, target: PostgresTarget, timeoutMs: number): PsqlSession
export const psqlArguments = (url: string, timeoutMs: number, sql: string): string[]
```

`psqlArguments` returns
`[url, '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', 'set default_transaction_read_only = on', '-c', 'set statement_timeout = <ms>', '-c', sql]`.
The runner is called with
`env: { PGPASSWORD: target.password ?? '', PGCONNECT_TIMEOUT: '10' }` (an empty
`PGPASSWORD` is harmless when the URL carries the password).

- [ ] **Step 1: Failing tests**

```ts
// tests/postgres/resolvePostgresTarget.test.ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { requirePostgresTarget } from '@/postgres/requirePostgresTarget.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'

const pooler =
  'postgresql://postgres.abc@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'

describe('resolvePostgresTarget', () => {
  afterEach(() => {
    delete process.env['SUPABASE_DB_PASSWORD']
  })
  it('prefers --db-url and keeps only the host name', () => {
    expect(
      resolvePostgresTarget('/p', {
        'db-url': 'postgres://u:secret@db.example.com:5432/d',
      }),
    ).toEqual({
      url: 'postgres://u:secret@db.example.com:5432/d',
      host: 'db.example.com',
    })
  })
  it('uses the linked pooler url with the password from the environment', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/pooler-url'), `${pooler}\n`)
    process.env['SUPABASE_DB_PASSWORD'] = 'pw'
    expect(resolvePostgresTarget(root, {})).toEqual({
      url: pooler,
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      password: 'pw',
    })
    delete process.env['SUPABASE_DB_PASSWORD']
    expect(resolvePostgresTarget(root, {})).toBeUndefined()
  })
  it('is undefined without a link, and requirePostgresTarget names both options', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(resolvePostgresTarget(root, {})).toBeUndefined()
    expect(() => requirePostgresTarget(root, {})).toThrow(
      /--db-url, or a linked project with SUPABASE_DB_PASSWORD/,
    )
  })
  it('rejects a --db-url that is not a url', () => {
    expect(() =>
      resolvePostgresTarget('/p', { 'db-url': 'not a url' }),
    ).toThrow(/--db-url is not a valid url/)
  })
})
```

```ts
// tests/postgres/psqlSession.test.ts
import { describe, expect, it } from 'vitest'

import { psqlArguments } from '@/postgres/psqlArguments.js'
import { psqlSession } from '@/postgres/psqlSession.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const target = { url: 'postgres://u@h/d', host: 'h', password: 'pw' }

describe('psqlSession', () => {
  it('opens every statement read-only with a timeout, before the query', () => {
    expect(psqlArguments('postgres://u@h/d', 30000, 'select 1')).toEqual([
      'postgres://u@h/d',
      '-X',
      '-q',
      '-A',
      '-t',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      'set default_transaction_read_only = on',
      '-c',
      'set statement_timeout = 30000',
      '-c',
      'select 1',
    ])
  })
  it('wraps rows in json_agg and passes the password through the environment only', () => {
    const seen: { args: string[]; env: Record<string, string> | undefined }[] =
      []
    const runner: CommandRunner = (_c, args, options) => {
      seen.push({ args, env: options.env })
      return { status: 0, stdout: '[{"a":1}]\n', stderr: '', missing: false }
    }
    expect(
      psqlSession(runner, '/p', target, 30000).rows('select 1 as a'),
    ).toEqual([{ a: 1 }])
    expect(seen[0]?.args.at(-1)).toBe(
      "select coalesce(json_agg(t), '[]'::json) from (select 1 as a) t",
    )
    expect(seen[0]?.env).toEqual({ PGPASSWORD: 'pw', PGCONNECT_TIMEOUT: '10' })
    expect(JSON.stringify(seen)).not.toContain('pw@')
  })
  it('returns an empty list for an empty result and raw text for text()', () => {
    const runner: CommandRunner = (_c, args) => ({
      status: 0,
      stdout: args.at(-1)?.startsWith('explain') ? '[{"Plan":{}}]' : '\n',
      stderr: '',
      missing: false,
    })
    const session = psqlSession(runner, '/p', target, 1000)
    expect(session.rows('select 1 where false')).toEqual([])
    expect(session.text('explain (format json) select 1')).toBe('[{"Plan":{}}]')
  })
  it('reports a missing psql as a missing tool and a failure by its stderr', () => {
    const missing: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() =>
      psqlSession(missing, '/p', target, 1000).rows('select 1'),
    ).toThrow(/psql.*install the PostgreSQL client/)
    const failing: CommandRunner = () => ({
      status: 2,
      stdout: '',
      stderr: 'psql: error: connection refused\n',
      missing: false,
    })
    expect(() =>
      psqlSession(failing, '/p', target, 1000).rows('select 1'),
    ).toThrow(/psql failed: psql: error: connection refused/)
  })
})
```

```ts
// tests/postgres/psqlSession.integration.test.ts
import { describe, expect, it } from 'vitest'

import { psqlSession } from '@/postgres/psqlSession.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const url = process.env['DB_QUALITY_TEST_DB_URL']

describe.skipIf(!url)('psqlSession against a real database', () => {
  it('refuses a write and answers a read', () => {
    const target = resolvePostgresTarget('/', { 'db-url': url })
    if (!target) throw new Error('unreachable')
    const session = psqlSession(spawnRunner, '/', target, 10000)
    expect(session.rows('select 1 as one')).toEqual([{ one: 1 }])
    expect(() => session.rows('create temp table dbq_probe (a int)')).toThrow(
      /read-only transaction/,
    )
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

```ts
// src/postgres/POOLER_URL_FILE.ts
/** Written by `supabase link`: user and host of the session pooler, never the password. */
export const POOLER_URL_FILE = 'supabase/.temp/pooler-url'
```

```ts
// src/postgres/DB_PASSWORD_ENV.ts
/** The variable the Supabase CLI itself reads for a linked project's database password. */
export const DB_PASSWORD_ENV = 'SUPABASE_DB_PASSWORD'
```

```ts
// src/postgres/resolvePostgresTarget.ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { env } from 'node:process'

import { ConfigError } from '@/config/ConfigError.js'
import { DB_PASSWORD_ENV } from '@/postgres/DB_PASSWORD_ENV.js'
import { POOLER_URL_FILE } from '@/postgres/POOLER_URL_FILE.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import type { PostgresTargetFlags } from '@/postgres/PostgresTargetFlags.js'

/** --db-url first; then the linked pooler url with the password from the environment; undefined when neither applies. */
export const resolvePostgresTarget = (
  root: string,
  flags: PostgresTargetFlags,
): PostgresTarget | undefined => {
  const explicit = flags['db-url']
  if (explicit !== undefined) {
    let host: string
    try {
      host = new URL(explicit).hostname
    } catch {
      throw new ConfigError('--db-url is not a valid url')
    }
    return { url: explicit, host }
  }
  const poolerPath = join(root, POOLER_URL_FILE)
  const password = env[DB_PASSWORD_ENV]
  if (!existsSync(poolerPath) || password === undefined || password === '')
    return undefined
  const url = readFileSync(poolerPath, 'utf8').trim()
  return { url, host: new URL(url).hostname, password }
}
```

```ts
// src/postgres/requirePostgresTarget.ts
import { ConfigError } from '@/config/ConfigError.js'
import { DB_PASSWORD_ENV } from '@/postgres/DB_PASSWORD_ENV.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import type { PostgresTargetFlags } from '@/postgres/PostgresTargetFlags.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'

export const requirePostgresTarget = (
  root: string,
  flags: PostgresTargetFlags,
): PostgresTarget => {
  const target = resolvePostgresTarget(root, flags)
  if (target) return target
  throw new ConfigError(
    `perf needs --db-url, or a linked project with ${DB_PASSWORD_ENV} set (the same variable the Supabase CLI reads)`,
  )
}
```

```ts
// src/postgres/psqlArguments.ts
export const psqlArguments = (
  url: string,
  timeoutMs: number,
  sql: string,
): string[] => [
  url,
  '-X',
  '-q',
  '-A',
  '-t',
  '-v',
  'ON_ERROR_STOP=1',
  '-c',
  'set default_transaction_read_only = on',
  '-c',
  `set statement_timeout = ${String(timeoutMs)}`,
  '-c',
  sql,
]
```

```ts
// src/postgres/psqlSession.ts
import { psqlArguments } from '@/postgres/psqlArguments.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import type { PsqlSession } from '@/postgres/PsqlSession.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// Every call is one psql process: the pooler ignores PGOPTIONS, so the
// read-only mode is a session SET sent before the query, every time. The
// password travels in the environment and never in an argument or a message.
export const psqlSession = (
  runner: CommandRunner,
  root: string,
  target: PostgresTarget,
  timeoutMs: number,
): PsqlSession => {
  const run = (sql: string): string => {
    const result = runner('psql', psqlArguments(target.url, timeoutMs, sql), {
      cwd: root,
      env: { PGPASSWORD: target.password ?? '', PGCONNECT_TIMEOUT: '10' },
    })
    if (result.missing)
      throw new ToolMissingError('psql', 'install the PostgreSQL client')
    if (result.status !== 0)
      throw new Error(`psql failed: ${result.stderr.trim()}`)
    return result.stdout
  }
  return {
    rows: (sql) => {
      const out = run(
        `select coalesce(json_agg(t), '[]'::json) from (${sql}) t`,
      ).trim()
      return out === '' ? [] : (JSON.parse(out) as unknown[])
    },
    text: (sql) => run(sql).trim(),
  }
}
```

Check `ToolMissingError`'s constructor signature in
`src/tools/ToolMissingError.ts` and match it.

- [ ] **Step 4: Update the spec's Connection section** — replace the `pg`
      paragraph with: driver is `psql` through `CommandRunner`; each call opens
      with the two `SET`s; measured on 2026-09-25 that `PGOPTIONS` does not
      reach the session through the Supabase pooler (an insert went through) and
      the `SET` does (a `CREATE TEMP TABLE` was refused); `SqlClient` is now
      `PsqlSession`.

- [ ] **Step 5: Run** — unit tests green; integration test skipped without the
      variable, and green with
      `DB_QUALITY_TEST_DB_URL=postgresql://$USER@localhost:5432/taxhacker pnpm test -- tests/postgres`
      (the local Postgres 18 accepts the read-only SET and refuses the temp
      table).

- [ ] **Step 6: Commit** —
      `feat(db-quality): a read-only Postgres session through psql`.

---

### Task 7: `perf snapshot`

**Files:**

- Create: `src/perf/StatementStat.ts`, `src/perf/TableStat.ts`,
  `src/perf/PerfSnapshot.ts`, `src/perf/PERF_SNAPSHOT_FILENAME.ts`,
  `src/perf/PLATFORM_NOISE.ts`, `src/perf/isPlatformNoise.ts`,
  `src/perf/statementStatsSql.ts`, `src/perf/TABLE_STATS_SQL.ts`,
  `src/perf/STATS_RESET_SQL.ts`, `src/perf/readStatementStats.ts`,
  `src/perf/readTableStats.ts`, `src/perf/readStatsReset.ts`,
  `src/perf/takePerfSnapshot.ts`, `src/perf/writePerfSnapshot.ts`,
  `src/perf/readPerfSnapshot.ts`
- Test: `tests/perf/isPlatformNoise.test.ts`,
  `tests/perf/takePerfSnapshot.test.ts`, `tests/perf/perfSnapshotFile.test.ts`,
  fixture `tests/fixtures/perf/statements.json`

**Interfaces:**

- Consumes: `PsqlSession`, `PerfConfig`, `PACKAGE_VERSION`.
- Produces:

```ts
export type StatementStat = { role: string; queryId: string; text: string; calls: number; totalMs: number; rows: number; sharedBlksRead: number; tempBlksWritten: number }
export type TableStat = { name: string; liveRows: number; seqScan: number; idxScan: number; bytes: number }
export type PerfSnapshot = { schemaVersion: 1; toolVersion: string; takenAt: string; host: string; statsReset: string | null; statements: StatementStat[]; tables: TableStat[] }
export const PERF_SNAPSHOT_FILENAME = '.codeality-db-perf.json'
export const isPlatformNoise = (text: string, ignore: string[]): boolean
export const takePerfSnapshot = (session: PsqlSession, perf: PerfConfig, host: string, takenAt: string): PerfSnapshot
export const writePerfSnapshot = (root: string, snapshot: PerfSnapshot): void   // atomic, like writeBaseline
export const readPerfSnapshot = (root: string): PerfSnapshot                     // ConfigError when absent or not version 1
```

- [ ] **Step 1: Failing tests**

```ts
// tests/perf/isPlatformNoise.test.ts
import { describe, expect, it } from 'vitest'

import { isPlatformNoise } from '@/perf/isPlatformNoise.js'

describe('isPlatformNoise', () => {
  it('drops the statements Supabase and PostgREST run on their own', () => {
    for (const text of [
      'select pg_sleep($1)',
      'SELECT name FROM pg_timezone_names',
      'WITH -- Recursively get the base types of domains base_types AS (',
      'SELECT wal->>$5 as type, wal->>$6 as schema',
      'COPY public.llm_debug_events (id) TO STDOUT',
      'select * from pg_stat_statements',
      "select coalesce(json_agg(t), '[]'::json) from (select 1) t",
    ])
      expect(isPlatformNoise(text, [])).toBe(true)
  })
  it('keeps the application and honours perf.ignore', () => {
    expect(isPlatformNoise('WITH pgrst_source AS (SELECT 1)', [])).toBe(false)
    expect(isPlatformNoise('select public.ping_generation_worker()', [])).toBe(
      false,
    )
    expect(
      isPlatformNoise('select public.ping_generation_worker()', [
        '^select public\\.ping_',
      ]),
    ).toBe(true)
  })
})
```

```json
// tests/fixtures/perf/statements.json
[
  {
    "role": "service_role",
    "query_id": "-11",
    "text": "WITH pgrst_source AS (SELECT 1)",
    "calls": 100,
    "total_ms": 2500.5,
    "rows": 100,
    "shared_blks_read": 3,
    "temp_blks_written": 0
  },
  {
    "role": "postgres",
    "query_id": "22",
    "text": "select public.ping_generation_worker()",
    "calls": 50,
    "total_ms": 250,
    "rows": 50,
    "shared_blks_read": 0,
    "temp_blks_written": 2
  },
  {
    "role": "authenticator",
    "query_id": "33",
    "text": "SELECT name FROM pg_timezone_names",
    "calls": 10,
    "total_ms": 6000,
    "rows": 5000,
    "shared_blks_read": 0,
    "temp_blks_written": 0
  }
]
```

```ts
// tests/perf/takePerfSnapshot.test.ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import { takePerfSnapshot } from '@/perf/takePerfSnapshot.js'
import type { PsqlSession } from '@/postgres/PsqlSession.js'

const statements = JSON.parse(
  readFileSync(
    new URL('../fixtures/perf/statements.json', import.meta.url),
    'utf8',
  ),
) as unknown[]

describe('takePerfSnapshot', () => {
  it('reads statements, tables and the reset marker, dropping the noise', () => {
    const sqls: string[] = []
    const session: PsqlSession = {
      rows: (sql) => {
        sqls.push(sql)
        if (sql.includes('pg_stat_statements_info'))
          return [{ stats_reset: '2026-05-07 22:41:57+00' }]
        if (sql.includes('pg_stat_user_tables'))
          return [
            {
              name: 'public.jobs',
              live_rows: 389,
              seq_scan: 30831,
              idx_scan: 321779,
              bytes: 3006464,
            },
          ]
        return statements
      },
      text: () => '',
    }
    const snapshot = takePerfSnapshot(
      session,
      PERF_DEFAULTS,
      'h',
      '2026-09-25T16:00:00.000Z',
    )
    expect(snapshot.statements.map((s) => s.queryId)).toEqual(['-11', '22'])
    expect(snapshot.statements[0]).toEqual({
      role: 'service_role',
      queryId: '-11',
      text: 'WITH pgrst_source AS (SELECT 1)',
      calls: 100,
      totalMs: 2500.5,
      rows: 100,
      sharedBlksRead: 3,
      tempBlksWritten: 0,
    })
    expect(snapshot.tables).toEqual([
      {
        name: 'public.jobs',
        liveRows: 389,
        seqScan: 30831,
        idxScan: 321779,
        bytes: 3006464,
      },
    ])
    expect(snapshot.statsReset).toBe('2026-05-07 22:41:57+00')
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      host: 'h',
      takenAt: '2026-09-25T16:00:00.000Z',
    })
    expect(sqls[0]).toContain(
      "r.rolname in ('authenticator', 'service_role', 'postgres')",
    )
  })
  it('tolerates a null reset marker', () => {
    const session: PsqlSession = {
      rows: (sql) => (sql.includes('_info') ? [{ stats_reset: null }] : []),
      text: () => '',
    }
    expect(
      takePerfSnapshot(session, PERF_DEFAULTS, 'h', 't').statsReset,
    ).toBeNull()
  })
})
```

```ts
// tests/perf/perfSnapshotFile.test.ts
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { readPerfSnapshot } from '@/perf/readPerfSnapshot.js'
import { writePerfSnapshot } from '@/perf/writePerfSnapshot.js'

const snapshot: PerfSnapshot = {
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt: 't',
  host: 'h',
  statsReset: null,
  statements: [],
  tables: [],
}

describe('perf snapshot file', () => {
  it('round-trips and never holds anything but the host', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writePerfSnapshot(root, snapshot)
    expect(readPerfSnapshot(root)).toEqual(snapshot)
    expect(
      readFileSync(join(root, PERF_SNAPSHOT_FILENAME), 'utf8'),
    ).not.toMatch(/password|postgres:\/\//)
  })
  it('names the command that creates it when absent', () => {
    expect(() => readPerfSnapshot(mkdtempSync(join(tmpdir(), 'dbq-')))).toThrow(
      /run "codeality-db perf snapshot"/,
    )
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

```ts
// src/perf/PLATFORM_NOISE.ts
/** Statements Supabase, PostgREST and this tool run on their own; none of them is the application's. */
export const PLATFORM_NOISE: RegExp[] = [
  /^select pg_sleep\(/i,
  /pg_timezone_names/i,
  /pg_stat_statements/i,
  /^WITH -- Recursively get the base types of domains/,
  /^SELECT wal->>/,
  /^COPY /i,
  /^select coalesce\(json_agg\(t\)/i,
]
```

```ts
// src/perf/isPlatformNoise.ts
import { PLATFORM_NOISE } from '@/perf/PLATFORM_NOISE.js'

export const isPlatformNoise = (text: string, ignore: string[]): boolean =>
  PLATFORM_NOISE.some((pattern) => pattern.test(text)) ||
  ignore.some((pattern) => new RegExp(pattern).test(text))
```

`new RegExp(pattern)` trips `security/detect-non-literal-regexp`; the patterns
come from the project's own configuration file, which is the documented purpose.
Disable the rule on that one line with the justification:
`// eslint-disable-next-line security/detect-non-literal-regexp -- perf.ignore is the project's own configuration`.

```ts
// src/perf/statementStatsSql.ts
/** Top-level statements of the application's roles; roles are validated identifiers (ROLE_NAME_PATTERN), so quoting them is enough. */
export const statementStatsSql = (roles: string[]): string =>
  `select r.rolname as role, s.queryid::text as query_id,
    left(regexp_replace(s.query, '\\s+', ' ', 'g'), 200) as text,
    s.calls::bigint as calls, s.total_exec_time as total_ms, s.rows::bigint as rows,
    s.shared_blks_read::bigint as shared_blks_read, s.temp_blks_written::bigint as temp_blks_written
  from pg_stat_statements s join pg_roles r on r.oid = s.userid
  where s.toplevel and r.rolname in (${roles.map((role) => `'${role}'`).join(', ')})`
```

```ts
// src/perf/TABLE_STATS_SQL.ts
export const TABLE_STATS_SQL = `select schemaname || '.' || relname as name, n_live_tup::bigint as live_rows,
    seq_scan::bigint as seq_scan, coalesce(idx_scan, 0)::bigint as idx_scan, pg_total_relation_size(relid)::bigint as bytes
  from pg_stat_user_tables where schemaname = 'public'`
```

```ts
// src/perf/STATS_RESET_SQL.ts
export const STATS_RESET_SQL =
  'select stats_reset::text as stats_reset from pg_stat_statements_info()'
```

`readStatementStats(session, perf)`:
`session.rows(statementStatsSql(perf.roles))`, map each row (typed as
`Record<string, unknown>`) to `StatementStat` with `Number(...)` on the numeric
fields and `String(...)` on `query_id`, filter
`!isPlatformNoise(text, perf.ignore)`, sort by `role` then `queryId`.
`readTableStats(session)`: same for `TABLE_STATS_SQL`, sorted by name.
`readStatsReset(session)`: first row's `stats_reset` as `string | null`.
`takePerfSnapshot` assembles
`{ schemaVersion: 1, toolVersion: PACKAGE_VERSION, takenAt, host, statsReset, statements, tables }`.
`writePerfSnapshot` mirrors `writeBaseline` (temp file, rename).
`readPerfSnapshot` mirrors `readBaseline` with the message
`${PERF_SNAPSHOT_FILENAME} not found; run "codeality-db perf snapshot"`.

- [ ] **Step 4: Run** — green.

- [ ] **Step 5: Commit** —
      `feat(db-quality): perf snapshot of pg_stat_statements and table statistics`.

---

### Task 8: `perf diff` with the improvement report

**Files:**

- Create: `src/perf/StatementWindow.ts`, `src/perf/TableWindow.ts`,
  `src/perf/windowStatements.ts`, `src/perf/windowTables.ts`,
  `src/perf/Improvement.ts`, `src/perf/improvementsIn.ts`,
  `src/perf/PerfDiff.ts`, `src/perf/perfFinding.ts`,
  `src/perf/statementFindings.ts`, `src/perf/tableFindings.ts`,
  `src/perf/diffSnapshots.ts`, `src/perf/renderImprovements.ts`,
  `src/perf/renderPerfDiff.ts`, `src/perf/renderPerfDiffJson.ts`
- Test: `tests/perf/windowStatements.test.ts`,
  `tests/perf/diffSnapshots.test.ts`, `tests/perf/renderPerfDiff.test.ts`

**Interfaces:**

- Consumes: `PerfSnapshot`, `PerfConfig`, `Finding`, `fingerprintFinding`,
  `isDisabled`.
- Produces:

```ts
export type StatementWindow = { role: string; queryId: string; text: string; calls: number; totalMs: number; tempBlksWritten: number; meanMs: number; previousMeanMs: number | null }
export type TableWindow = { name: string; liveRows: number; seqScan: number; idxScan: number }
export type Improvement = { subject: string; previousMs: number; currentMs: number; calls: number; savedMs: number }
export type PerfDiff = { from: string; to: string; improvements: Improvement[]; findings: Finding[]; savedMs: number; lostMs: number }
export const windowStatements = (previous: PerfSnapshot, current: PerfSnapshot): StatementWindow[]
export const windowTables = (previous: PerfSnapshot, current: PerfSnapshot): TableWindow[]
export const diffSnapshots = (previous: PerfSnapshot, current: PerfSnapshot, perf: PerfConfig, disabled: DisableEntry[]): PerfDiff
export const renderPerfDiff = (diff: PerfDiff): string
export const renderPerfDiffJson = (diff: PerfDiff): string
```

Window arithmetic, per statement matched by `role|queryId`:

- reset when `current.statsReset !== previous.statsReset`, or the statement is
  new, or any counter went down: the window is the current absolute values and
  `previousMeanMs` is `null` (a new statement has nothing to regress from; a
  reset loses the old mean too, since the old totals were measured against a
  different history).
- otherwise the window is the delta and
  `previousMeanMs = previous.totalMs / previous.calls` (`null` when
  `previous.calls === 0`).
- `meanMs = calls === 0 ? 0 : totalMs / calls`.

Findings (`path: 'postgres'`, `line: 0`, fingerprint context `role|queryId`,
subject `${role}: ${text.slice(0, 80)}`) only for windows with
`calls >= perf.minCalls`:

- `BDB901` `error` when
  `previousMeanMs !== null && meanMs >= 5 && meanMs >= previousMeanMs * (1 + perf.regressionPercent / 100)`;
  message `mean 12.30 ms -> 45.60 ms (+271%) over 1,234 calls`.
- `BDB902` `warn` when `meanMs >= perf.slowMs`; message
  `mean 601.80 ms over 1,729 calls, threshold 100 ms`.
- `BDB904` `warn` when `tempBlksWritten > 0`; message
  `wrote 48 temp blocks over 200 calls: a sort or hash spilled to disk`.
- `BDB903` `warn` per table window with
  `liveRows >= perf.seqScanRows && seqScan > idxScan`; subject the table name,
  fingerprint context the table name; message
  `30,831 sequential scans against 12 index scans on 15,000 live rows`.

Improvements: windows with
`previousMeanMs !== null && calls >= minCalls && meanMs <= previousMeanMs * (1 - regressionPercent / 100)`;
`savedMs = (previousMeanMs - meanMs) * calls`. `savedMs` on the diff is the sum;
`lostMs` is `Σ (meanMs - previousMeanMs) * calls` over the `BDB901` windows.

- [ ] **Step 1: Failing tests**

```ts
// tests/perf/windowStatements.test.ts
import { describe, expect, it } from 'vitest'

import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'
import { windowStatements } from '@/perf/windowStatements.js'

const stat = (
  queryId: string,
  calls: number,
  totalMs: number,
  tempBlksWritten = 0,
) => ({
  role: 'service_role',
  queryId,
  text: `q${queryId}`,
  calls,
  totalMs,
  rows: 0,
  sharedBlksRead: 0,
  tempBlksWritten,
})
const snap = (
  statsReset: string | null,
  statements: ReturnType<typeof stat>[],
): PerfSnapshot => ({
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt: 't',
  host: 'h',
  statsReset,
  statements,
  tables: [],
})

describe('windowStatements', () => {
  it('takes the delta and the previous mean when the counters continued', () => {
    const window = windowStatements(
      snap('r1', [stat('1', 100, 1000)]),
      snap('r1', [stat('1', 150, 1750, 4)]),
    )
    expect(window).toEqual([
      {
        role: 'service_role',
        queryId: '1',
        text: 'q1',
        calls: 50,
        totalMs: 750,
        tempBlksWritten: 4,
        meanMs: 15,
        previousMeanMs: 10,
      },
    ])
  })
  it('uses absolute values with no previous mean after a reset, for a new statement, or when a counter fell', () => {
    const reset = windowStatements(
      snap('r1', [stat('1', 100, 1000)]),
      snap('r2', [stat('1', 20, 400)]),
    )
    expect(reset[0]).toMatchObject({
      calls: 20,
      totalMs: 400,
      meanMs: 20,
      previousMeanMs: null,
    })
    const fresh = windowStatements(
      snap('r1', []),
      snap('r1', [stat('2', 30, 60)]),
    )
    expect(fresh[0]).toMatchObject({
      calls: 30,
      meanMs: 2,
      previousMeanMs: null,
    })
    const fell = windowStatements(
      snap('r1', [stat('1', 100, 1000)]),
      snap('r1', [stat('1', 90, 900)]),
    )
    expect(fell[0]).toMatchObject({ calls: 90, previousMeanMs: null })
  })
  it('a statement gone from the current reading is not a window', () => {
    expect(
      windowStatements(snap('r1', [stat('1', 100, 1000)]), snap('r1', [])),
    ).toEqual([])
  })
})
```

```ts
// tests/perf/diffSnapshots.test.ts
import { describe, expect, it } from 'vitest'

import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import { diffSnapshots } from '@/perf/diffSnapshots.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'

const stat = (
  queryId: string,
  calls: number,
  totalMs: number,
  tempBlksWritten = 0,
) => ({
  role: 'service_role',
  queryId,
  text: `q${queryId}`,
  calls,
  totalMs,
  rows: 0,
  sharedBlksRead: 0,
  tempBlksWritten,
})
const table = (
  name: string,
  liveRows: number,
  seqScan: number,
  idxScan: number,
) => ({ name, liveRows, seqScan, idxScan, bytes: 0 })
const snap = (
  statements: ReturnType<typeof stat>[],
  tables: ReturnType<typeof table>[] = [],
): PerfSnapshot => ({
  schemaVersion: 1,
  toolVersion: '0.2.0',
  takenAt: 't',
  host: 'h',
  statsReset: 'r',
  statements,
  tables,
})

describe('diffSnapshots', () => {
  it('reports a regression, a slow query, a spill, a seq-scan table and an improvement', () => {
    const previous = snap(
      [
        stat('reg', 100, 1000),
        stat('slow', 100, 100),
        stat('spill', 100, 100),
        stat('better', 100, 10000),
        stat('few', 100, 100),
      ],
      [
        table('public.big', 20000, 100, 100),
        table('public.small', 10, 1000, 0),
      ],
    )
    const current = snap(
      [
        stat('reg', 200, 3000),
        stat('slow', 200, 30100),
        stat('spill', 200, 200, 48),
        stat('better', 200, 12000),
        stat('few', 105, 5000),
      ],
      [
        table('public.big', 20000, 5100, 200),
        table('public.small', 10, 9000, 0),
      ],
    )
    const diff = diffSnapshots(previous, current, PERF_DEFAULTS, [])
    expect(diff.findings.map((f) => [f.code, f.subject])).toEqual([
      ['BDB901', 'service_role: qreg'],
      ['BDB902', 'service_role: qslow'],
      ['BDB903', 'public.big'],
      ['BDB904', 'service_role: qspill'],
    ])
    expect(diff.findings[0]?.message).toBe(
      'mean 10.00 ms -> 20.00 ms (+100%) over 100 calls',
    )
    expect(diff.improvements).toEqual([
      {
        subject: 'service_role: qbetter',
        previousMs: 100,
        currentMs: 20,
        calls: 100,
        savedMs: 8000,
      },
    ])
    expect(diff.savedMs).toBe(8000)
    expect(diff.lostMs).toBe(1000)
    expect(diff.from).toBe('t')
  })
  it('honours disable and minCalls', () => {
    const previous = snap([stat('reg', 100, 1000)])
    const current = snap([stat('reg', 200, 3000)])
    expect(
      diffSnapshots(previous, current, PERF_DEFAULTS, [
        { code: 'BDB901', reason: 'r' },
      ]).findings,
    ).toEqual([])
    expect(
      diffSnapshots(previous, snap([stat('reg', 110, 3000)]), PERF_DEFAULTS, [])
        .findings,
    ).toEqual([])
  })
})
```

Work the numbers: `reg` window 100 calls, 2000 ms, mean 20 vs previous 10 (+100
%), lost 1000. `slow` window 100 calls, 30000 ms, mean 300 ≥ 100, and also a
regression (+29900 %) — so the expected list must include `BDB901` for `slow`
too: use `stat('slow', 100, 25000)` previous and `stat('slow', 200, 55000)`
current, mean 250 previous and 300 current (+20 % exactly meets the threshold,
`>=`, so it fires). Choose the fixture so that each statement triggers exactly
one code: previous `slow` `(100, 30000)` mean 300, current `(200, 60000)` mean
300: `BDB902` only. `spill` mean 1 ms: below 5 ms, no `BDB901`. `better` 100 vs
20: improvement, saved 8000. `few` 5 calls: skipped. Tables: `big` window seq
5000 > idx 100 with 20000 rows: `BDB903`; `small` 10 rows: nothing. Findings are
sorted with `compareFindings` (by path, line, code, subject — check
`src/model/compareFindings.ts` and order the expectation accordingly).

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement** the files listed, following the arithmetic above.
      `perfFinding(code, severity, subject, context, message)` builds the
      `Finding` with `path: 'postgres'`, `line: 0`. `renderPerfDiff`:

```
perf diff: 2026-09-25T16:00:00.000Z -> 2026-09-26T09:12:00.000Z
improvements
  -80%   100.00 ms -> 20.00 ms  x100  service_role: qbetter
saved 8,000 ms against the previous means; regressions cost 1,000 ms
postgres:0: BDB901 mean 10.00 ms -> 20.00 ms (+100%) over 100 calls (service_role: qreg)
...
4 findings
```

`renderPerfDiffJson`:
`JSON.stringify({ schemaVersion: 1, from, to, savedMs, lostMs, improvements, findings }, null, 2)`.
Numbers through `toLocaleString('en-US')` for the counts and `toFixed(2)` for
milliseconds; no `Intl` locale other than `en-US`.

- [ ] **Step 4: Run** — green.

- [ ] **Step 5: Commit** —
      `feat(db-quality): perf diff with an improvement report and BDB901-904`.

---

### Task 9: `perf bench`

**Files:**

- Create: `src/bench/BenchQuery.ts`, `src/bench/readBenchQueries.ts`,
  `src/bench/RUNS_HEADER.ts`, `src/bench/ExplainSummary.ts`,
  `src/bench/PlanNode.ts`, `src/bench/walkPlan.ts`,
  `src/bench/summarizeExplain.ts`, `src/bench/BenchEntry.ts`,
  `src/bench/BenchRecord.ts`, `src/bench/BENCH_RECORD_FILENAME.ts`,
  `src/bench/runBenchQuery.ts`, `src/bench/median.ts`,
  `src/bench/benchFindings.ts`, `src/bench/BenchResult.ts`,
  `src/bench/runBench.ts`, `src/bench/readBenchRecord.ts`,
  `src/bench/writeBenchRecord.ts`, `src/bench/renderBench.ts`,
  `src/bench/renderBenchJson.ts`
- Test: `tests/bench/readBenchQueries.test.ts`,
  `tests/bench/summarizeExplain.test.ts`, `tests/bench/benchFindings.test.ts`,
  `tests/bench/runBench.test.ts`, fixtures
  `tests/fixtures/bench/index_scan.json`, `tests/fixtures/bench/seq_scan.json`
  (two real `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` outputs; take them from
  the local Postgres against a temp table with and without an index:
  `create table t as select g as id, md5(g::text) as v from generate_series(1, 20000) g; create index on t (id); explain (analyze, buffers, format json) select * from t where id = 5;`
  then `drop index` and repeat)

**Interfaces:**

- Consumes: `PsqlSession`, `PerfConfig`, `fingerprintFinding`.
- Produces:

```ts
export type BenchQuery = { file: string; sql: string; runs: number }
export type ExplainSummary = { executionMs: number; seqScans: { relation: string; rows: number }[]; indexScans: string[]; worstEstimateRatio: number }
export type BenchEntry = { medianMs: number; minMs: number; runs: number; seqScans: { relation: string; rows: number }[]; indexScans: string[]; worstEstimateRatio: number }
export type BenchRecord = { schemaVersion: 1; toolVersion: string; takenAt: string; host: string; entries: Record<string, BenchEntry> }
export type BenchResult = { entries: Record<string, BenchEntry>; findings: Finding[]; improvements: Improvement[] }
export const readBenchQueries = (root: string, benchDir: string, defaultRuns: number): BenchQuery[]
export const summarizeExplain = (explainJson: string): ExplainSummary
export const runBenchQuery = (session: PsqlSession, query: BenchQuery): BenchEntry
export const benchFindings = (file: string, benchDir: string, recorded: BenchEntry | undefined, current: BenchEntry, perf: PerfConfig, disabled: DisableEntry[]): Finding[]
export const runBench = (session: PsqlSession, root: string, perf: PerfConfig, recorded: BenchRecord | undefined, disabled: DisableEntry[]): BenchResult
```

`seqScans[].rows` is
`("Actual Rows" + "Rows Removed by Filter") * "Actual Loops"` of the `Seq Scan`
node, the rows the scan touched, not the rows it returned. `indexScans` are the
`Relation Name`s of `Index Scan`, `Index Only Scan` and `Bitmap Heap Scan`
nodes. `worstEstimateRatio` is the maximum over nodes with both counts above
zero of `max(plan / actual, actual / plan)`, using `(x + 1) / (y + 1)` to
survive zeros. A `-- runs: N` first line overrides `defaultRuns`. Files are read
in name order; a file that is empty after stripping comments is a `ConfigError`
naming it.

- [ ] **Step 1: Failing tests**

```ts
// tests/bench/summarizeExplain.test.ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { summarizeExplain } from '@/bench/summarizeExplain.js'

const fixture = (name: string): string =>
  readFileSync(new URL(`../fixtures/bench/${name}`, import.meta.url), 'utf8')

describe('summarizeExplain', () => {
  it('reads the execution time and the index scan', () => {
    const summary = summarizeExplain(fixture('index_scan.json'))
    expect(summary.executionMs).toBeGreaterThan(0)
    expect(summary.indexScans).toEqual(['t'])
    expect(summary.seqScans).toEqual([])
  })
  it('reads a sequential scan with the rows it touched', () => {
    const summary = summarizeExplain(fixture('seq_scan.json'))
    expect(summary.seqScans).toEqual([{ relation: 't', rows: 20000 }])
    expect(summary.worstEstimateRatio).toBeGreaterThanOrEqual(1)
  })
  it('rejects output that is not an explain document', () => {
    expect(() => summarizeExplain('[]')).toThrow(/not an EXPLAIN document/)
  })
})
```

```ts
// tests/bench/benchFindings.test.ts
import { describe, expect, it } from 'vitest'

import { benchFindings } from '@/bench/benchFindings.js'
import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'

const entry = (
  medianMs: number,
  seqScans: { relation: string; rows: number }[] = [],
  indexScans: string[] = [],
  worstEstimateRatio = 1,
) => ({
  medianMs,
  minMs: medianMs,
  runs: 5,
  seqScans,
  indexScans,
  worstEstimateRatio,
})

describe('benchFindings', () => {
  it('BDB911 needs both the percentage and five milliseconds', () => {
    expect(
      benchFindings(
        'a.sql',
        'bench',
        entry(100),
        entry(125),
        PERF_DEFAULTS,
        [],
      ).map((f) => f.code),
    ).toEqual(['BDB911'])
    expect(
      benchFindings('a.sql', 'bench', entry(1), entry(1.5), PERF_DEFAULTS, []),
    ).toEqual([])
    expect(
      benchFindings(
        'a.sql',
        'bench',
        entry(100),
        entry(110),
        PERF_DEFAULTS,
        [],
      ),
    ).toEqual([])
  })
  it('BDB912 on a new sequential scan over a big table or over a relation that had an index scan', () => {
    expect(
      benchFindings(
        'a.sql',
        'bench',
        entry(1, [], ['t']),
        entry(1, [{ relation: 't', rows: 10 }]),
        PERF_DEFAULTS,
        [],
      ).map((f) => f.code),
    ).toEqual(['BDB912'])
    expect(
      benchFindings(
        'a.sql',
        'bench',
        entry(1),
        entry(1, [{ relation: 'u', rows: 20000 }]),
        PERF_DEFAULTS,
        [],
      ).map((f) => f.code),
    ).toEqual(['BDB912'])
    expect(
      benchFindings(
        'a.sql',
        'bench',
        entry(1, [{ relation: 'u', rows: 20000 }]),
        entry(1, [{ relation: 'u', rows: 20000 }]),
        PERF_DEFAULTS,
        [],
      ),
    ).toEqual([])
    expect(
      benchFindings(
        'a.sql',
        'bench',
        entry(1),
        entry(1, [{ relation: 'u', rows: 10 }]),
        PERF_DEFAULTS,
        [],
      ),
    ).toEqual([])
  })
  it('BDB913 needs no record and points at the file', () => {
    const findings = benchFindings(
      'a.sql',
      'bench',
      undefined,
      entry(1, [], [], 250),
      PERF_DEFAULTS,
      [],
    )
    expect(findings.map((f) => [f.code, f.path, f.line])).toEqual([
      ['BDB913', 'bench/a.sql', 1],
    ])
  })
})
```

```ts
// tests/bench/runBench.test.ts
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runBench } from '@/bench/runBench.js'
import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import type { PsqlSession } from '@/postgres/PsqlSession.js'

const fixture = (name: string): string =>
  readFileSync(new URL(`../fixtures/bench/${name}`, import.meta.url), 'utf8')

describe('runBench', () => {
  it('warms up, runs N times, takes the median, and compares with the record', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'db-quality/bench'), { recursive: true })
    writeFileSync(
      join(root, 'db-quality/bench/by_id.sql'),
      '-- runs: 3\nselect * from t where id = 5;\n',
    )
    const sqls: string[] = []
    const session: PsqlSession = {
      rows: () => [],
      text: (sql) => {
        sqls.push(sql)
        return fixture('seq_scan.json')
      },
    }
    const recorded = {
      schemaVersion: 1 as const,
      toolVersion: '0.2.0',
      takenAt: 't',
      host: 'h',
      entries: {
        'by_id.sql': {
          medianMs: 0.01,
          minMs: 0.01,
          runs: 3,
          seqScans: [],
          indexScans: ['t'],
          worstEstimateRatio: 1,
        },
      },
    }
    const result = runBench(session, root, PERF_DEFAULTS, recorded, [])
    expect(sqls).toHaveLength(4)
    expect(sqls[0]).toBe(
      'explain (analyze, buffers, format json) select * from t where id = 5',
    )
    expect(result.entries['by_id.sql']?.runs).toBe(3)
    expect(result.findings.map((f) => f.code)).toEqual(['BDB911', 'BDB912'])
  })
  it('measures without judging when there is no record', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'db-quality/bench'), { recursive: true })
    writeFileSync(join(root, 'db-quality/bench/a.sql'), 'select 1;')
    const session: PsqlSession = {
      rows: () => [],
      text: () => fixture('index_scan.json'),
    }
    const result = runBench(session, root, PERF_DEFAULTS, undefined, [])
    expect(result.findings).toEqual([])
    expect(Object.keys(result.entries)).toEqual(['a.sql'])
  })
  it('refuses an empty file and a missing directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const session: PsqlSession = { rows: () => [], text: () => '' }
    expect(() => runBench(session, root, PERF_DEFAULTS, undefined, [])).toThrow(
      /db-quality\/bench is not a directory/,
    )
    mkdirSync(join(root, 'db-quality/bench'), { recursive: true })
    writeFileSync(join(root, 'db-quality/bench/empty.sql'), '-- nothing\n')
    expect(() => runBench(session, root, PERF_DEFAULTS, undefined, [])).toThrow(
      /empty.sql holds no statement/,
    )
  })
})
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

`readBenchQueries`: `ConfigError` when `benchDir` is not a directory; for each
`*.sql` in name order, read, take `runs` from a first line matching
`/^--\s*runs:\s*(\d+)/`, strip line comments with `stripSqlComments` (exists in
`src/sql/`), trim, drop one trailing `;`, `ConfigError` when empty.

`walkPlan(node: PlanNode, visit: (node: PlanNode) => void)`: visit, then recurse
into `node.Plans ?? []`. `PlanNode` type:
`{ 'Node Type': string; 'Relation Name'?: string; 'Plan Rows': number; 'Actual Rows': number; 'Actual Loops': number; 'Rows Removed by Filter'?: number; Plans?: PlanNode[] }`.

`summarizeExplain(text)`: `JSON.parse`; expect an array whose first element has
`Plan` and `'Execution Time'`, else
`throw new Error('psql output is not an EXPLAIN document')`; walk and collect as
specified.

`runBenchQuery(session, query)`: `const explain = `explain (analyze, buffers,
format json) ${query.sql}``; run once (warm-up, result discarded), then
`query.runs` times collecting `summarizeExplain(session.text(explain))`;
`medianMs = median(times)`, `minMs = Math.min(...)`, plan fields from the last
summary. `median` in its own file: sort a copy, middle element or the mean of
the two middle ones.

`benchFindings`: `path: `${benchDir}/${file}``, `line: 1`, fingerprint context
`file`:

- `BDB911` `error`:
  `recorded && current.medianMs >= recorded.medianMs * (1 + pct / 100) && current.medianMs - recorded.medianMs >= 5`;
  message `median 100.00 ms -> 125.00 ms (+25%) over 5 runs`.
- `BDB912` `error`:
  `recorded && current.seqScans.some((scan) => !recorded.seqScans.some((r) => r.relation === scan.relation) && (scan.rows >= perf.seqScanRows || recorded.indexScans.includes(scan.relation)))`;
  subject the relation; message
  `sequential scan over 20,000 rows of "t" where the record had an index scan`
  or `... where the record had none`.
- `BDB913` `warn`: `current.worstEstimateRatio >= 100`; message
  `planner estimate off by 250x: run ANALYZE or raise the statistics target`.

`runBench`: read queries, for each `runBenchQuery`, collect `entries`, findings
via
`benchFindings(file, perf.benchDir, recorded?.entries[file], entry, perf, disabled)`,
improvements where
`recorded && entry.medianMs <= recordedEntry.medianMs * (1 - pct / 100)` as
`Improvement` with `calls: entry.runs` and
`savedMs = (recorded.medianMs - entry.medianMs)`.

`readBenchRecord(root)` returns `undefined` when absent (the command decides),
`ConfigError` on a wrong version; `writeBenchRecord` atomic.
`renderBench(result, recorded)`:

```
bench (5 runs each)
  by_id.sql        0.42 ms   (record 0.40 ms)
  list_open.sql   12.10 ms   (no record)
improvements
  -35%   18.60 ms -> 12.10 ms  list_open.sql
db-quality/bench/by_id.sql:1: BDB912 sequential scan over 20,000 rows of "t" where the record had an index scan (t)
1 findings
```

- [ ] **Step 4: Run** — green (fixtures captured from the local Postgres as
      described; keep them under 6 KB each).

- [ ] **Step 5: Commit** —
      `feat(db-quality): perf bench with EXPLAIN ANALYZE and BDB911-913`.

---

### Task 10: The `perf` command and the gate stage

**Files:**

- Create: `src/perf/PERF_USAGE.ts`, `src/perf/PerfAction.ts`,
  `src/perf/perfActionFrom.ts`, `src/commands/perfCommand.ts`,
  `src/commands/perfSnapshotAction.ts`, `src/commands/perfDiffAction.ts`,
  `src/commands/perfBenchAction.ts`, `src/commands/PerfActionIo.ts`,
  `src/gate/perfStage.ts`, `src/gate/StageOutcome.ts`
- Modify: `src/cli/COMMANDS.ts`, `src/cli/USAGE.ts`, `src/gate/Stage.ts`,
  `src/gate/runStage.ts`, `src/gate/gateStages.ts`,
  `src/gate/renderGateReport.ts`
- Test: `tests/commands/perfCommand.test.ts`, `tests/gate/perfStage.test.ts`,
  `tests/gate/gateStages.test.ts` (extend), `tests/cli/runCli.test.ts` (extend:
  `perf` is listed in the usage)

**Interfaces:**

- Consumes: everything from Tasks 6 to 9.
- Produces: `perfCommand(argv, io): number` with actions
  `snapshot | diff | bench`, flags `--db-url <url>`, `--json`, `--record` (bench
  only);
  `type StageOutcome = Finding[] | 'not-applicable' | { skipped: string }`;
  `Stage.run: () => StageOutcome`; `perfStage(context: CheckContext): Stage`.

Behaviour:

- `perf snapshot`: target required;
  `takePerfSnapshot(session, config.perf, target.host, new Date().toISOString())`;
  write; print
  `recorded N statements and M tables from <host> in .codeality-db-perf.json`;
  exit 0.
- `perf diff`: target required; previous from file; current taken now (not
  written); `diffSnapshots`; print `renderPerfDiff` or JSON; exit 1 when
  findings, else 0.
- `perf bench`: target required; `--record` writes the record and prints the
  entries with `(recorded)`; without it, compares against the record when
  present; exit 1 when findings.
- All three print the legacy-config notice first when it applies, and
  `configuration error` exit 2 without a target.
- `perfStage`: `'not-applicable'` when `!config.perf.inGate`;
  `{ skipped: 'no --db-url and no linked project with SUPABASE_DB_PASSWORD' }`
  when no target;
  `{ skipped: 'no perf snapshot and no bench record; run "perf snapshot" or "perf bench --record"' }`
  when neither file exists; otherwise the concatenation of the diff findings
  (when the snapshot exists) and the bench findings (when the record exists).
- `runStage`: a `{ skipped }` outcome becomes `skipped-not-applicable` with
  `detail = skipped`; `renderGateReport` prints the detail line for a skipped
  stage when it is not empty (indented, like findings).

- [ ] **Step 1: Failing tests**

```ts
// tests/commands/perfCommand.test.ts
import { mkdirSync, mkdtempSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { perfCommand } from '@/commands/perfCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { commandIoFor } from '@tests/commands/commandIoFor.js'

const config = '{"schemaVersion":2}'
const url = 'postgres://u:p@db.example.com/d'
const psql: CommandRunner = (_c, args) => {
  const sql = args.at(-1) ?? ''
  const stdout = sql.includes('_info')
    ? '[{"stats_reset":"r"}]'
    : sql.includes('pg_stat_user_tables')
      ? '[]'
      : sql.startsWith('explain')
        ? '[{"Plan":{"Node Type":"Result","Plan Rows":1,"Actual Rows":1,"Actual Loops":1},"Execution Time":0.5}]'
        : '[]'
  return { status: 0, stdout, stderr: '', missing: false }
}
const rootWith = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  writeFileSync(join(root, 'codeality-db.json'), config)
  return root
}

describe('perfCommand', () => {
  it('needs an action and a target', () => {
    const io = commandIoFor(rootWith(), psql)
    expect(perfCommand([], io)).toBe(2)
    expect(io.err.join('')).toMatch(
      /usage: codeality-db perf snapshot\|diff\|bench/,
    )
    const noTarget = commandIoFor(rootWith(), psql)
    expect(perfCommand(['snapshot'], noTarget)).toBe(2)
    expect(noTarget.err.join('')).toMatch(/--db-url/)
  })
  it('snapshot writes the file and diff reads it back', () => {
    const root = rootWith()
    const io = commandIoFor(root, psql)
    expect(perfCommand(['snapshot', '--db-url', url], io)).toBe(0)
    expect(existsSync(join(root, '.codeality-db-perf.json'))).toBe(true)
    expect(io.out.join('')).toMatch(
      /recorded 0 statements and 0 tables from db.example.com/,
    )
    const diff = commandIoFor(root, psql)
    expect(perfCommand(['diff', '--db-url', url, '--json'], diff)).toBe(0)
    expect(JSON.parse(diff.out.join(''))).toMatchObject({
      schemaVersion: 1,
      findings: [],
      improvements: [],
    })
  })
  it('bench records, then compares', () => {
    const root = rootWith()
    mkdirSync(join(root, 'db-quality/bench'), { recursive: true })
    writeFileSync(join(root, 'db-quality/bench/a.sql'), 'select 1;')
    expect(
      perfCommand(
        ['bench', '--record', '--db-url', url],
        commandIoFor(root, psql),
      ),
    ).toBe(0)
    expect(existsSync(join(root, '.codeality-db-bench.json'))).toBe(true)
    const io = commandIoFor(root, psql)
    expect(perfCommand(['bench', '--db-url', url], io)).toBe(0)
    expect(io.out.join('')).toMatch(/a\.sql/)
  })
  it('reports psql failures as infrastructure', () => {
    const failing: CommandRunner = () => ({
      status: 2,
      stdout: '',
      stderr: 'connection refused',
      missing: false,
    })
    const io = commandIoFor(rootWith(), failing)
    expect(perfCommand(['snapshot', '--db-url', url], io)).toBe(3)
    expect(io.err.join('')).toMatch(/psql failed: connection refused/)
  })
})
```

```ts
// tests/gate/perfStage.test.ts
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { perfStage } from '@/gate/perfStage.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const runner: CommandRunner = () => ({
  status: 0,
  stdout: '[]',
  stderr: '',
  missing: false,
})

describe('perfStage', () => {
  it('is not applicable when perf.inGate is false', () => {
    const config = configFromDocument({
      schemaVersion: 2,
      perf: { inGate: false },
    })
    expect(perfStage({ root: '/p', config, runner }).run()).toBe(
      'not-applicable',
    )
  })
  it('says why it skipped without a target, and without state files', () => {
    const config = configFromDocument({ schemaVersion: 2 })
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(perfStage({ root, config, runner }).run()).toEqual({
      skipped: 'no --db-url and no linked project with SUPABASE_DB_PASSWORD',
    })
  })
})
```

The "no state files" branch needs a target: set
`process.env['SUPABASE_DB_PASSWORD'] = 'pw'` and write
`supabase/.temp/pooler-url` in the temp root, then expect
`{ skipped: 'no perf snapshot and no bench record; run "perf snapshot" or "perf bench --record"' }`;
clean the variable in `afterEach`. A third test writes a snapshot file with the
runner answering `[{"stats_reset":"r"}]` for `_info` and `[]` otherwise, and
expects `[]` (no findings).

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

```ts
// src/commands/perfCommand.ts
import type { CommandIo } from '@/commands/CommandIo.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { perfBenchAction } from '@/commands/perfBenchAction.js'
import { perfDiffAction } from '@/commands/perfDiffAction.js'
import { perfSnapshotAction } from '@/commands/perfSnapshotAction.js'
import { reportCommandError } from '@/commands/reportCommandError.js'
import { legacyConfigNotice } from '@/config/legacyConfigNotice.js'
import { readConfig } from '@/config/readConfig.js'
import { perfActionFrom } from '@/perf/perfActionFrom.js'
import { psqlSession } from '@/postgres/psqlSession.js'
import { requirePostgresTarget } from '@/postgres/requirePostgresTarget.js'

export const perfCommand = (argv: string[], io: CommandIo): number => {
  try {
    const { values, positionals } = parseCommandArgs(argv, {
      json: { type: 'boolean' },
      record: { type: 'boolean' },
      'db-url': { type: 'string' },
    })
    const action = perfActionFrom(positionals)
    const config = readConfig(io.root)
    const notice = legacyConfigNotice(config)
    if (notice) io.stderr(`${notice}\n`)
    const target = requirePostgresTarget(io.root, {
      'db-url': values['db-url'] as string | undefined,
    })
    const timeout = action === 'bench' ? config.perf.benchTimeoutMs : 30000
    const session = psqlSession(io.runner, io.root, target, timeout)
    const actionIo = {
      io,
      config,
      target,
      session,
      json: values['json'] === true,
      record: values['record'] === true,
    }
    if (action === 'snapshot') return perfSnapshotAction(actionIo)
    if (action === 'diff') return perfDiffAction(actionIo)
    return perfBenchAction(actionIo)
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
```

`PerfActionIo` type in its own file:
`{ io: CommandIo; config: DbQualityConfig; target: PostgresTarget; session: PsqlSession; json: boolean; record: boolean }`.
The `30000` default belongs in `src/perf/QUERY_TIMEOUT_MS.ts`.

`perfSnapshotAction`: take, write, print, return `ExitCode.OK`.
`perfDiffAction`: `const previous = readPerfSnapshot(io.root)`,
`const current = takePerfSnapshot(session, config.perf, target.host, new Date().toISOString())`,
`const diff = diffSnapshots(previous, current, config.perf, config.disable)`,
print, return by findings. `perfBenchAction`:
`const recorded = record ? undefined : readBenchRecord(io.root)`,
`const result = runBench(session, io.root, config.perf, recorded, config.disable)`,
when `record` write
`{ schemaVersion: 1, toolVersion, takenAt, host, entries: result.entries }` and
print `recorded N bench queries in .codeality-db-bench.json`, else print
`renderBench` and return by findings.

`perfStage`:

```ts
// src/gate/perfStage.ts
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'
import { readBenchRecord } from '@/bench/readBenchRecord.js'
import { runBench } from '@/bench/runBench.js'
import type { CheckContext } from '@/check/CheckContext.js'
import type { Stage } from '@/gate/Stage.js'
import type { StageOutcome } from '@/gate/StageOutcome.js'
import type { Finding } from '@/model/Finding.js'
import { diffSnapshots } from '@/perf/diffSnapshots.js'
import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import { QUERY_TIMEOUT_MS } from '@/perf/QUERY_TIMEOUT_MS.js'
import { readPerfSnapshot } from '@/perf/readPerfSnapshot.js'
import { takePerfSnapshot } from '@/perf/takePerfSnapshot.js'
import { psqlSession } from '@/postgres/psqlSession.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'

// The stage says what it did not measure: a green stage that measured
// nothing is exactly the false comfort the gate exists to remove.
export const perfStage = ({ root, config, runner }: CheckContext): Stage => ({
  name: 'perf',
  run: (): StageOutcome => {
    if (!config.perf.inGate) return 'not-applicable'
    const target = resolvePostgresTarget(root, {})
    if (!target)
      return {
        skipped: 'no --db-url and no linked project with SUPABASE_DB_PASSWORD',
      }
    const hasSnapshot = existsSync(join(root, PERF_SNAPSHOT_FILENAME))
    const hasRecord = existsSync(join(root, BENCH_RECORD_FILENAME))
    if (!hasSnapshot && !hasRecord)
      return {
        skipped:
          'no perf snapshot and no bench record; run "perf snapshot" or "perf bench --record"',
      }
    const findings: Finding[] = []
    if (hasSnapshot) {
      const session = psqlSession(runner, root, target, QUERY_TIMEOUT_MS)
      const current = takePerfSnapshot(
        session,
        config.perf,
        target.host,
        new Date().toISOString(),
      )
      findings.push(
        ...diffSnapshots(
          readPerfSnapshot(root),
          current,
          config.perf,
          config.disable,
        ).findings,
      )
    }
    if (hasRecord) {
      const session = psqlSession(
        runner,
        root,
        target,
        config.perf.benchTimeoutMs,
      )
      findings.push(
        ...runBench(
          session,
          root,
          config.perf,
          readBenchRecord(root),
          config.disable,
        ).findings,
      )
    }
    return findings
  },
})
```

Over 50 lines: split the two branches into `perfDiffFindings(context, target)`
and `perfBenchFindings(context, target)` files. `gateStages` appends
`perfStage(context)` after the audit stage. `USAGE` gains the line
`perf      snapshot|diff|bench [--db-url <url>] [--json] [--record]   record, compare and benchmark the live database`.
`COMMANDS` gains `perf: perfCommand`.

- [ ] **Step 4: Run** — green; the gate tests that assert stage names now expect
      `['check' | 'baseline-check', 'audit', 'perf']`.

- [ ] **Step 5: Commit** —
      `feat(db-quality): perf command and the perf gate stage`.

---

### Task 11: `init` for schemaVersion 2, the bench directory and the adoption ladder

**Files:**

- Create: `src/init/upgradedConfigDocument.ts`, `src/init/PERF_INIT_SECTION.ts`,
  `src/init/planBenchReadme.ts`, `src/init/BENCH_README.ts`,
  `src/init/adoptionPhase.ts`, `src/init/ADOPTION_LADDER.ts`,
  `src/init/renderAdoptionPhase.ts`
- Modify: `src/init/planConfigFile.ts`, `src/init/planInit.ts`,
  `src/commands/initCommand.ts`, `assets/db-quality.yml` (env: add
  `SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}` beside the access
  token, with a comment that the perf stage skips itself without it)
- Test: `tests/init/upgradedConfigDocument.test.ts`,
  `tests/init/planConfigFile.test.ts` (extend),
  `tests/init/adoptionPhase.test.ts`, `tests/commands/initCommand.test.ts`
  (extend)

**Interfaces:**

- Produces: `PERF_INIT_SECTION = { ...PERF_DEFAULTS, inGate: false }`;
  `upgradedConfigDocument(raw: Record<string, unknown>, detected: StackSections): Record<string, unknown>`;
  `adoptionPhase(root: string, config: DbQualityConfig): 0 | 1 | 2 | 3 | 4`;
  `renderAdoptionPhase(phase): string`.

Rules:

- A new config file is
  `{ schemaVersion: 2, ...detectStacks(root), perf: PERF_INIT_SECTION }` (the
  `postgrest` key comes from `detectStacks`).
- An existing valid `schemaVersion: 1` file is planned as `merge` with detail
  `upgraded to schemaVersion 2` and content
  `upgradedConfigDocument(raw, detectStacks(root))`: `schemaVersion: 2`, every
  string in `disable` becomes `{ code, reason: LEGACY_DISABLE_REASON }`,
  `postgrest` added from detection when absent, `perf` added as
  `PERF_INIT_SECTION` when absent, every other key kept as it is.
- An existing valid `schemaVersion: 2` file is `unchanged`.
- `planBenchReadme`: `create` `${perf.benchDir}/README.md` with `BENCH_README`
  when absent, else `unchanged`. `BENCH_README` explains: one statement per
  `.sql` file, literals inline, optional `-- runs: N` first line, the session is
  read-only so a write fails, `perf bench --record` fixes the reference and
  `perf bench` compares.
- `adoptionPhase`: 0 without a config file; 1 with a `schemaVersion: 2` config;
  2 when `.codeality-db-perf.json` exists; 3 when `.codeality-db-bench.json`
  exists; 4 when `config.perf.inGate` is true and at least one of the two files
  exists. Each phase implies the previous ones; a `schemaVersion: 1` config is
  phase 0.
- `initCommand` prints `renderAdoptionPhase(phase)` after the plan: the ladder
  from `ADOPTION_LADDER` with the current phase marked and the next step named,
  always, so `init --check` in CI also shows where the project stands.

- [ ] **Step 1: Failing tests**

```ts
// tests/init/upgradedConfigDocument.test.ts
import { describe, expect, it } from 'vitest'

import { LEGACY_DISABLE_REASON } from '@/config/LEGACY_DISABLE_REASON.js'
import { PERF_INIT_SECTION } from '@/init/PERF_INIT_SECTION.js'
import { upgradedConfigDocument } from '@/init/upgradedConfigDocument.js'

describe('upgradedConfigDocument', () => {
  it('bumps the version, objectifies disable, adds the new sections and keeps the rest', () => {
    const raw = {
      schemaVersion: 1,
      supabase: { migrations: 'm' },
      audit: { inGate: true },
      disable: ['BDB001'],
    }
    expect(
      upgradedConfigDocument(raw, { postgrest: { roots: ['src'] } }),
    ).toEqual({
      schemaVersion: 2,
      supabase: { migrations: 'm' },
      audit: { inGate: true },
      disable: [{ code: 'BDB001', reason: LEGACY_DISABLE_REASON }],
      postgrest: { roots: ['src'] },
      perf: PERF_INIT_SECTION,
    })
  })
  it('does not overwrite sections the file already has', () => {
    const raw = {
      schemaVersion: 1,
      postgrest: { roots: ['app'] },
      perf: { inGate: true },
    }
    expect(
      upgradedConfigDocument(raw, { postgrest: { roots: ['src'] } }),
    ).toMatchObject({ postgrest: { roots: ['app'] }, perf: { inGate: true } })
  })
})
```

```ts
// tests/init/adoptionPhase.test.ts
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { adoptionPhase } from '@/init/adoptionPhase.js'
import { renderAdoptionPhase } from '@/init/renderAdoptionPhase.js'

describe('adoptionPhase', () => {
  it('climbs the ladder with the files and the flag', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(adoptionPhase(root, configFromDocument({ schemaVersion: 1 }))).toBe(
      0,
    )
    const v2 = configFromDocument({ schemaVersion: 2 })
    expect(adoptionPhase(root, v2)).toBe(1)
    writeFileSync(join(root, '.codeality-db-perf.json'), '{}')
    expect(adoptionPhase(root, v2)).toBe(2)
    writeFileSync(join(root, '.codeality-db-bench.json'), '{}')
    expect(adoptionPhase(root, v2)).toBe(3)
    expect(
      adoptionPhase(
        root,
        configFromDocument({ schemaVersion: 2, perf: { inGate: true } }),
      ),
    ).toBe(4)
  })
  it('renders the ladder with the current phase and the next step', () => {
    const text = renderAdoptionPhase(1)
    expect(text).toMatch(/^adoption phase 1 of 4/m)
    expect(text).toMatch(/next: codeality-db perf snapshot/)
  })
})
```

Extend `tests/init/planConfigFile.test.ts`: a `schemaVersion: 1` file yields
`merge` with detail `upgraded to schemaVersion 2` and content whose `disable`
entries are objects; a new file has `schemaVersion: 2` and
`perf.inGate === false`. Extend `tests/commands/initCommand.test.ts`:
`init --apply` on a root with `package.json` depending on
`@supabase/supabase-js` and a `src` directory writes `postgrest.roots`, the
bench README, and prints `adoption phase 1 of 4`.

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement** the files as specified. `ADOPTION_LADDER`: five
      entries `{ phase, does, next }` copied from the spec's table, with `next`
      being the command that reaches the following phase
      (`codeality-db init --apply`, `codeality-db baseline update` is folded
      into phase 1's line, `codeality-db perf snapshot`,
      `codeality-db perf bench --record`,
      `set perf.inGate to true in codeality-db.json`, and for phase 4
      `nothing: the gate measures`). `renderAdoptionPhase(phase)` prints
      `adoption phase N of 4`, one line per rung with `*` on the current one,
      and `next: ...`.

- [ ] **Step 4: Run** — green.

- [ ] **Step 5: Commit** —
      `feat(db-quality): init upgrades to schemaVersion 2 and shows the adoption ladder`.

---

### Task 12: Documentation, version 0.2.0, and the monorepo check

**Files:**

- Modify: `packages/db-quality/package.json` (`version: 0.2.0`), `CHANGELOG.md`,
  `README.md`, root `knip.config.ts` if `typescript` needs listing under
  `ignoreDependencies` for the workspace (it should not; check `pnpm knip`).

- [ ] **Step 1: README** — add sections: "Strict mode" (no `info`, `disable`
      with a reason, `schemaVersion` 2, the legacy notice); "PostgREST rules"
      (the five codes, what each proves and what it cannot see: dynamic table
      names, columns behind `.match()`, views); "Performance"
      (`perf snapshot`/`diff`/`bench`, the improvement report, the window
      arithmetic in three sentences, the noise list and `perf.ignore`, the
      read-only session, `SUPABASE_DB_PASSWORD` as the CLI's own variable,
      `psql` as a requirement, `pooler-url` from `supabase link`); "Adoption in
      phases" (the spec's table verbatim); extend the findings table with
      `BDB801`-`BDB805`, `BDB901`-`BDB904`, `BDB911`-`BDB913`, the exit codes
      unchanged, the configuration example from the spec. Update the `usage`
      block with `perf`.

- [ ] **Step 2: CHANGELOG**

```markdown
## 0.2.0

- Strict mode: no `info` severity, every finding fails the gate unless the
  baseline or a `disable` entry with a written `reason` covers it.
  `schemaVersion: 2`; a version 1 file still works and `init --apply` upgrades
  it.
- `BDB801`-`BDB805`: rules on the PostgREST query chains in `.ts`/`.tsx` sources
  under `postgrest.roots`.
- `perf snapshot`, `perf diff` and `perf bench`: `pg_stat_statements` and table
  statistics with an improvement report and `BDB901`-`BDB904`; the project's own
  bench queries under `EXPLAIN ANALYZE` with `BDB911`-`BDB913`. The `perf` gate
  stage runs them when `perf.inGate` is true and a target resolves.
- The live connection is `psql` with a session-level read-only `SET`: the
  Supabase pooler ignores `PGOPTIONS`.
```

- [ ] **Step 3: Version** — set `0.2.0`, run `pnpm sync-versions` at the root,
      then `pnpm check:ci` and `pnpm knip` at the root, both green.

- [ ] **Step 4: Commit** — `docs(db-quality): 0.2.0 documentation and version`.

---

### Task 13: Validation on the real projects and the release

This task is the owner's condition: real use surfaces divergences. Every
divergence is fixed in the package (its own commit) before the release.

- [ ] **Step 1: verticagtm phase 0 and 1** — in `~/p/verticagtm`, run the
      package from the checkout:
      `DBQ=~/p/codeality/packages/db-quality/bin/codeality-db.mjs`.
      `node $DBQ check` before `init --apply`: the count must equal the 0.1.0
      count (131 known through the baseline, `baseline check` 0 new) because
      `postgrest` is not configured yet. Then `node $DBQ init --apply` (expect
      `merge codeality-db.json upgraded to schemaVersion 2`,
      `create db-quality/bench/README.md`, `adoption phase 1 of 4`),
      `node $DBQ check` and sample ten `BDB80x` findings by hand against the
      source; record the counts per code. Every false positive is a divergence.
      Then `node $DBQ baseline update` and `node $DBQ gate` (baseline-check
      passed).

- [ ] **Step 2: verticagtm phase 2** — `SUPABASE_DB_PASSWORD` from the project's
      `.env.local` in the environment (`set -a; source .env.local; set +a` in a
      subshell, never printed): `node $DBQ perf snapshot`; check the file holds
      the host and no password (`grep -c postgres:// .codeality-db-perf.json` is
      0). Wait for real traffic (an hour of the deployed app, or the `pg_cron`
      jobs alone: `ping_generation_worker` runs every few seconds, so twenty
      minutes gives them `minCalls`), then `node $DBQ perf diff`: the
      improvement report and findings render; with no deploy between the two
      readings, `BDB901` must be empty and `BDB902` may list the slow `pg_cron`
      functions. Record the output.

- [ ] **Step 3: verticagtm phase 3** — write two bench files from the
      application's real reads: `db-quality/bench/waitlist_latest.sql` from
      `src/app-actions/load-waitlist-signups.ts`
      (`select id, email, company, source, created_at from public.waitlist_signups order by created_at desc limit 50`)
      and `db-quality/bench/org_snapshot_products.sql` from
      `src/lib/supabase/load-org-snapshot.ts` (the `products` read filtered by
      an `organization_id` taken from a real row:
      `select id from public.organizations limit 1` through `psql`, pasted as a
      literal). `node $DBQ perf bench --record`, then `node $DBQ perf bench` (no
      findings, both `(record ...)`). Read the plans in the record: a `Seq Scan`
      on `waitlist_signups` with 3 rows is right; a `Seq Scan` on `products`
      filtered by `organization_id` would be a finding once the table passes
      `seqScanRows`, which is what the rule is for.

- [ ] **Step 4: verticagtm phase 4** — set `perf.inGate: true`, run
      `node $DBQ gate` with the password in the environment: `perf` stage runs
      both and reports; without the password: `skipped-not-applicable  perf`
      with the detail line. `pnpm db:gate` in CI stays green (no password
      there). Commit the adoption in verticagtm once the package is released
      (Step 8), not before.

- [ ] **Step 5: pxpn** — in `~/p/pxpn`, `node $DBQ init` (plan only: expect
      `postgrest.roots` detected), then with a temporary config written by
      `init --apply`: `node $DBQ check`, sample ten `BDB80x` findings by hand,
      record the counts, then revert the generated files
      (`git checkout -- package.json`, remove `codeality-db.json`, the workflow,
      the bench README directory) leaving the repository's pre-existing changes
      untouched (its `TODO.md` is modified by someone else; never
      `git checkout -- .`).

- [ ] **Step 6: Fix every divergence in the package** — one commit each, with a
      test that reproduces it, pushed to `main`.

- [ ] **Step 7: Record** — `packages/db-quality/docs/validation-2026-09.md`
      gains a "0.2.0" section: one table per family (`BDB80x` on verticagtm and
      pxpn with counts by code and the sampled verdicts; `perf diff` on
      verticagtm with the window length, the improvement report and the
      findings; `perf bench` with the two files, their medians and plans), the
      divergences and their fixes, and the `PGOPTIONS` measurement. Commit
      `test(db-quality): validation of 0.2.0 against verticagtm and pxpn`.

- [ ] **Step 8: Release** —
      `gh workflow run publish.yml -R syntopica/codeality -f package=db-quality`,
      watch the run (`gh run watch`), confirm
      `npm view @syntopica/db-quality version` answers `0.2.0` (allow the
      registry a few minutes). This run is the end-to-end proof of the trusted
      publisher registered on 2026-09-25.

- [ ] **Step 9: Adopt** — in `~/p/verticagtm`:
      `pnpm add -D @syntopica/db-quality@0.2.0`, `pnpm db:gate` (baseline-check
      passed, audit findings as before, perf skipped without the password),
      commit
      `ci(db): adopt db-quality 0.2.0 with the PostgREST rules, the perf reference and the strict configuration`
      with `codeality-db.json`, `.codeality-db-baseline.json`,
      `.codeality-db-perf.json`, `.codeality-db-bench.json`,
      `db-quality/bench/*`, `package.json`, `pnpm-lock.yaml`,
      `pnpm-workspace.yaml`, `.github/workflows/db-quality.yml`; push; watch the
      `Database quality` run to `success`.

- [ ] **Step 10: Close** — `TODO_LOG.md` in codeality gets the dated entry with
      the run ids and the counts; `CHANGELOG.md` already says 0.2.0. Report to
      the owner: counts per repository and family, the improvement report from
      the real diff, divergences fixed, the `PGOPTIONS` finding, and what phase
      every other Supabase repository would start at.

---

## Self-review

**Spec coverage.** Strict mode and `disable` reasons: Task 1. Configuration
sections and defaults: Task 2. Index knowledge: Task 3. Chain collection and the
five rules: Tasks 4-5. Connection and the read-only session: Task 6 (with the
`psql` deviation recorded and the spec updated). Snapshot, diff, improvement
report, `BDB901`-`904`: Tasks 7-8. Bench and `BDB911`-`913`: Task 9. `perf`
command, gate stage with named skips: Task 10. `init` upgrade, bench README,
adoption ladder, workflow env: Task 11. README, CHANGELOG, version: Task 12.
Validation, release, adoption: Task 13. Out of scope items are not planned.

**Placeholder scan.** No "TBD", no "similar to Task N"; every code step shows
the code or names the exact file and behaviour. Task 8 and 9 renderers are
specified by example output. Task 13 names the exact bench queries and the exact
reverts.

**Type consistency.** `DisableEntry[]` everywhere `disabled` is passed (Tasks 1,
5, 8, 9). `PsqlSession { rows, text }` in Tasks 6-10. `PerfSnapshot`,
`StatementStat`, `TableStat` in Tasks 7, 8, 10. `BenchEntry`, `BenchRecord`,
`BenchResult`, `Improvement` in Tasks 9-10 (`Improvement` is defined in Task 8
and reused by the bench). `StageOutcome` in Task 10 only. `PERF_DEFAULTS`
(Task 2) versus `PERF_INIT_SECTION` (Task 11): the former is the parsing default
with `inGate: true`, the latter what `init` writes with `inGate: false`, as the
spec states.
