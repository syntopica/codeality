# Database Quality Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@syntopica/db-quality`, a CLI (`codeality-db`) that lints
Supabase migrations, Prisma schemas, Drizzle code and SQLite files statically,
audits a live Supabase project, carries existing debt in a baseline and runs it
all as one gate with honest exit codes.

**Architecture:** A common `Finding` model fed by adapters. Static adapters wrap
squawk, prisma-lint, eslint-plugin-drizzle and `sqlite3`, plus five SQL rules of
our own over the whole migration set. Live adapters wrap `supabase db advisors`,
`supabase inspect db` and Soda Core. Every external tool is spawned through one
injectable `CommandRunner`, so parsers are tested on saved JSON and the real
binaries only in guarded integration tests. Commands (`init`, `check`, `audit`,
`gate`, `baseline`) compose those pieces; the gate is a list of stages with the
`codeality-py` semantics.

**Tech Stack:** TypeScript 6 (`@typescript/typescript6`), Node >= 22, tsup (ESM
only), vitest 5, `node:util` `parseArgs`, `node:child_process` `spawnSync`,
`node:crypto`. No runtime dependencies. Optional peers: `squawk-cli` 2.66,
`prisma-lint` 0.13, `eslint` 10, `eslint-plugin-drizzle` 0.2,
`typescript-eslint` 8.

**Spec:** `docs/superpowers/specs/2026-09-25-db-quality-design.md`

## Global Constraints

- Package name `@syntopica/db-quality`, directory `packages/db-quality`,
  executable `codeality-db`, `engines.node >= 22`, `"type": "module"`, MIT.
- Exit codes: 0 passed, 1 findings, 2 invalid usage or configuration, 3
  infrastructure (required tool missing or unusable). `check` never writes. A
  required tool that is missing is exit 3, never a skip.
- House ESLint policy applies to `src/`: exactly one exported top-level
  declaration per file, no non-exported top-level declarations, no inline types
  in runtime files, files under 100 code lines, no `utils/` or `helpers/`
  folders, and a file named `format*`/`validate*`/`map*`/`select*`/`use*` must
  live in `formatters/`/`validators/`/`mappers/`/`selectors/`/`hooks/`. Avoid
  those prefixes for plain functions instead. Tests (`tests/**`) may hold local
  helpers and are capped at 200 lines.
- Finding codes: `BDB001`-`BDB005` (own SQL rules), `BDB100/<squawk rule>`,
  `BDB200/<prisma-lint rule>`, `BDB300/<drizzle rule>`, `BDB401`-`BDB403`
  (sqlite), `BDB500/<splinter name>`, `BDB601`-`BDB602` (inspect),
  `BDB700/<soda check>`. (The spec wrote the families as `BDB1xx/...`; the
  concrete form is `BDB100/...`.)
- Squawk rules excluded under the Supabase profile: `prefer-robust-stmts`,
  `require-lock-timeout`, `require-statement-timeout`,
  `require-concurrent-index-creation`.
- Supabase CLI calls use `--output-format json`: advisors return
  `{"results":[...]}`, inspect returns `{"rows":[...]}`. On error the CLI prints
  `{"_tag":"Error","error":{"code":...,"message":...}}`.
- prisma-lint `-o json` prints `{"violations":[...]}` on **stderr** and exits 1
  when there are violations.
- squawk `--reporter json` prints a JSON array on stdout; `level` is `Warning`
  or `Error`; `--exclude a,b` is comma separated; it exits 1 when it reports
  anything.
- Soda:
  `uvx --with setuptools --from soda-core-<type> soda scan -d <name> -c <configuration.yml> -srf <results.json> <checks.yml>`;
  the `--with setuptools` shim is mandatory (Soda 4.25 imports `distutils`).
- Commits: conventional type, scope `db-quality`, no assistant attribution.
  Format with prettier before committing (`pnpm exec prettier --write <files>`).
- All commands in this plan run from the monorepo root `~/p/codeality` unless a
  `cd` is shown. Package scripts run as
  `pnpm --filter @syntopica/db-quality <script>`.

## File structure

```
packages/db-quality/
  package.json  tsconfig.json  tsconfig.build.json  tsup.config.ts  vitest.config.ts  eslint.config.ts
  LICENSE  README.md  CHANGELOG.md
  bin/codeality-db.mjs                     # imports ../dist/cli.js
  assets/prisma-lint.json                  # shipped prisma-lint config
  assets/drizzle-eslint.config.mjs         # shipped flat config for the drizzle rules
  assets/db-quality.yml                    # CI workflow written by init
  src/
    cli.ts                                 # argv -> command
    assetPath.ts                           # resolve a shipped asset
    packageVersion.ts
    model/       Severity.ts Finding.ts ExitCode.ts compareFindings.ts normalizeSqlText.ts fingerprintFinding.ts
    config/      DbQualityConfig.ts ConfigError.ts CONFIG_FILENAME.ts readConfig.ts validateConfigDocument.ts detectStacks.ts isDisabled.ts
    sql/         SqlStatement.ts stripSqlComments.ts splitSqlStatements.ts MigrationFile.ts readMigrationSet.ts qualifiedName.ts statementAtLine.ts
    rules/       SqlRule.ts makeSqlFinding.ts policyTable.ts createdTables.ts rlsEnabledTables.ts policyTables.ts
                 permissivePolicy.ts rlsEnabledNoPolicy.ts tableWithoutRls.ts authUidNotWrapped.ts definerWithoutSearchPath.ts SQL_RULES.ts runSqlRules.ts
    tools/       CommandResult.ts CommandRunner.ts spawnRunner.ts ToolMissingError.ts
    adapters/
      squawk/    SUPABASE_SQUAWK_EXCLUDES.ts SquawkEntry.ts parseSquawkReport.ts runSquawk.ts
      prisma/    PrismaViolation.ts parsePrismaLintReport.ts runPrismaLint.ts
      drizzle/   EslintFileResult.ts parseEslintReport.ts runDrizzleLint.ts
      sqlite/    sqliteQuery.ts hasPrimaryKey.ts runSqliteChecks.ts
      supabase/  AdvisorEntry.ts parseAdvisorReport.ts CliError.ts parseCliError.ts runAdvisors.ts IndexStatRow.ts BloatRow.ts parseIndexStats.ts parseBloat.ts runInspect.ts
      soda/      dataSourceType.ts renderSodaConfiguration.ts SodaCheckResult.ts parseSodaResults.ts runSoda.ts
    check/       CheckContext.ts runCheck.ts renderFindings.ts renderFindingsJson.ts
    baseline/    BASELINE_FILENAME.ts BaselineFile.ts readBaseline.ts writeBaseline.ts ClassifiedFindings.ts classifyFindings.ts
    audit/       AuditTarget.ts resolveAuditTarget.ts runAudit.ts
    gate/        StageStatus.ts StageResult.ts Stage.ts runStage.ts gateStages.ts runGate.ts gateExitCode.ts renderGateReport.ts
    init/        PlanDisposition.ts ManagedFile.ts planConfigFile.ts planPackageScript.ts planWorkflow.ts planInit.ts applyInit.ts renderInitPlan.ts
    commands/    parseCommandArgs.ts checkCommand.ts auditCommand.ts gateCommand.ts baselineCommand.ts initCommand.ts
  tests/         mirrors src, plus tests/fixtures/{migrations,reports,prisma}
```

---

### Task 1: Package scaffold

**Files:**

- Create: `packages/db-quality/package.json`, `tsconfig.json`,
  `tsconfig.build.json`, `tsup.config.ts`, `vitest.config.ts`,
  `eslint.config.ts`, `LICENSE`, `README.md`, `CHANGELOG.md`,
  `bin/codeality-db.mjs`, `src/cli.ts`, `src/packageVersion.ts`,
  `src/assetPath.ts`
- Modify: `.github/workflows/publish.yml:22-27` (add `- db-quality`),
  `CLAUDE.md` (valid `package` values list)
- Test: `tests/packageVersion.test.ts`

**Interfaces:**

- Produces: `PACKAGE_VERSION: string`; `assetPath(name: string): string`
  (absolute path of `assets/<name>`); `bin/codeality-db.mjs` running
  `dist/cli.js`.

- [ ] **Step 1: Write package.json**

```json
{
  "name": "@syntopica/db-quality",
  "version": "0.1.0",
  "private": false,
  "packageManager": "pnpm@12.5.1",
  "license": "MIT",
  "description": "Database quality gate: lint Supabase migrations, Prisma and Drizzle schemas and SQLite files, audit a live Supabase project, carry debt in a baseline",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/syntopica/codeality.git",
    "directory": "packages/db-quality"
  },
  "homepage": "https://github.com/syntopica/codeality/tree/main/packages/db-quality#readme",
  "bugs": { "url": "https://github.com/syntopica/codeality/issues" },
  "publishConfig": { "access": "public" },
  "type": "module",
  "engines": { "node": ">=22" },
  "bin": { "codeality-db": "bin/codeality-db.mjs" },
  "files": ["LICENSE", "README.md", "assets", "bin", "dist"],
  "scripts": {
    "build": "tsup",
    "lint": "eslint src tests bin --max-warnings 0",
    "lint:fix": "eslint src tests bin --fix",
    "lint:suppress": "eslint src tests bin --suppress-all",
    "lint:prune": "eslint src tests bin --prune-suppressions",
    "type-check": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run --coverage",
    "publish:check": "baseline-licenses && publint --strict"
  },
  "peerDependencies": {
    "eslint": ">=9.0.0",
    "eslint-plugin-drizzle": ">=0.2.0",
    "prisma-lint": ">=0.13.0",
    "squawk-cli": ">=2.0.0",
    "typescript-eslint": ">=8.0.0"
  },
  "peerDependenciesMeta": {
    "eslint": { "optional": true },
    "eslint-plugin-drizzle": { "optional": true },
    "prisma-lint": { "optional": true },
    "squawk-cli": { "optional": true },
    "typescript-eslint": { "optional": true }
  },
  "devDependencies": {
    "@syntopica/eslint-config": "workspace:*",
    "@syntopica/tsconfig": "workspace:*",
    "@types/node": "^26.6.2",
    "@vitest/coverage-v8": "^5.0.1",
    "eslint": "^10.11.0",
    "eslint-plugin-drizzle": "^0.2.3",
    "eslint-plugin-regexp": "^3.3.1",
    "prisma-lint": "^0.13.1",
    "publint": "^0.3.24",
    "squawk-cli": "^2.66.0",
    "tsup": "^8.5.1",
    "typescript": "npm:@typescript/typescript6@^6.0.2",
    "typescript-eslint": "^8.70.1",
    "vitest": "^5.0.1"
  }
}
```

- [ ] **Step 2: Write the TypeScript, build, test and lint configuration**

`tsconfig.json`:

```json
{
  "extends": "@syntopica/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "types": ["node"],
    "paths": { "@/*": ["./src/*"], "@tests/*": ["./tests/*"] }
  },
  "include": ["src/**/*", "tests/**/*", "tsup.config.ts", "vitest.config.ts"]
}
```

`tsconfig.build.json`:

```json
{
  "extends": "../tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "noEmit": true,
    "rootDir": "src",
    "types": ["node"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*"]
}
```

`tsup.config.ts` (one ESM bundle; the CLI exports nothing, so no declarations):

```ts
import path from 'node:path'

import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node22',
  esbuildOptions(options) {
    options.alias = { '@': path.resolve(import.meta.dirname, 'src') }
  },
})
```

`vitest.config.ts`:

```ts
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Declarative wiring and the process boundary: argv parsing and the
      // real spawn are exercised by the integration tests, not measured.
      exclude: ['src/cli.ts', 'src/tools/spawnRunner.ts', 'src/**/[A-Z]*.ts'],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@tests\/(.*)\.js$/,
        replacement: fileURLToPath(new URL('./tests/$1.ts', import.meta.url)),
      },
      {
        find: /^@\/(.*)\.js$/,
        replacement: fileURLToPath(new URL('./src/$1.ts', import.meta.url)),
      },
    ],
  },
})
```

(The `[A-Z]*.ts` glob excludes the type-only and constant-only files, which have
no branches.)

`eslint.config.ts`:

```ts
import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createCodeQualityConfig } from '@syntopica/eslint-config/code-quality'
import { createNodeConfig } from '@syntopica/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
  { ignores: ['dist/**', 'coverage/**', 'assets/**'] },
]
```

Copy `LICENSE` from `packages/quality-config/LICENSE`. `CHANGELOG.md`:

```markdown
# Changelog

## 0.1.0 - Unreleased

- Initial release: `init`, `check`, `audit`, `gate`, `baseline`.
```

`README.md` starts as the title and one line; Task 16 fills it.

- [ ] **Step 3: Write the bin, the version and the asset resolver**

`bin/codeality-db.mjs`:

```js
#!/usr/bin/env node
import '../dist/cli.js'
```

`src/packageVersion.ts`:

```ts
import { createRequire } from 'node:module'

// Read at runtime from the package's own manifest so the bundle never carries
// a copy that drifts from `package.json`. Both `dist/cli.js` and `src/` sit
// one level below the package root.
export const PACKAGE_VERSION: string = (
  createRequire(import.meta.url)('../package.json') as { version: string }
).version
```

`src/assetPath.ts`:

```ts
import { fileURLToPath } from 'node:url'

// `assets/` is one level up from both `dist/cli.js` (the bundle) and `src/`.
export const assetPath = (name: string): string =>
  fileURLToPath(new URL(`../assets/${name}`, import.meta.url))
```

`src/cli.ts` (placeholder body replaced in Task 15; keep it runnable now):

```ts
import { argv, exit, stdout } from 'node:process'

import { PACKAGE_VERSION } from '@/packageVersion.js'

if (argv.includes('--version')) {
  stdout.write(`codeality-db ${PACKAGE_VERSION}\n`)
  exit(0)
}
stdout.write('codeality-db: no command yet\n')
exit(2)
```

- [ ] **Step 4: Write the failing test**

`tests/packageVersion.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { PACKAGE_VERSION } from '@/packageVersion.js'

describe('PACKAGE_VERSION', () => {
  it('is the semver in package.json', () => {
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
```

- [ ] **Step 5: Install, build, test**

Run:
`pnpm install && pnpm --filter @syntopica/db-quality build && pnpm --filter @syntopica/db-quality test && node packages/db-quality/bin/codeality-db.mjs --version`
Expected: install adds the new workspace and the peer tools to the lockfile;
build writes `dist/cli.js`; the test passes; the last command prints
`codeality-db 0.1.0`.

- [ ] **Step 6: Register the package for publishing**

Add `- db-quality` after `- quality-config` in `.github/workflows/publish.yml`
and to the "Valid `package` values" sentence in `CLAUDE.md`.

- [ ] **Step 7: Lint and type-check, then commit**

Run:
`pnpm --filter @syntopica/db-quality lint && pnpm --filter @syntopica/db-quality type-check && pnpm exec prettier --write packages/db-quality .github/workflows/publish.yml CLAUDE.md`

```bash
git add packages/db-quality pnpm-lock.yaml .github/workflows/publish.yml CLAUDE.md
git commit -m "feat(db-quality): scaffold the database quality package"
```

---

### Task 2: Finding model, fingerprints, ordering

**Files:**

- Create: `src/model/Severity.ts`, `src/model/Finding.ts`,
  `src/model/ExitCode.ts`, `src/model/normalizeSqlText.ts`,
  `src/model/fingerprintFinding.ts`, `src/model/compareFindings.ts`
- Test: `tests/model/normalizeSqlText.test.ts`,
  `tests/model/fingerprintFinding.test.ts`,
  `tests/model/compareFindings.test.ts`

**Interfaces:**

- Produces:
  - `type Severity = 'error' | 'warn' | 'info'`
  - `type Finding = { code: string; severity: Severity; path: string; line: number; message: string; subject: string; fingerprint: string }`
  - `const ExitCode = { OK: 0, FINDINGS: 1, CONFIGURATION: 2, INFRASTRUCTURE: 3 } as const`
  - `normalizeSqlText(text: string): string` — lowercase, whitespace collapsed,
    trimmed
  - `fingerprintFinding(finding: Omit<Finding, 'fingerprint'>, context: string): string`
    — 16 hex chars
  - `compareFindings(a: Finding, b: Finding): number` — by path, line, code

- [ ] **Step 1: Write the failing tests**

`tests/model/normalizeSqlText.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { normalizeSqlText } from '@/model/normalizeSqlText.js'

describe('normalizeSqlText', () => {
  it('folds case and collapses whitespace', () => {
    expect(
      normalizeSqlText('  CREATE   POLICY "p"\n  ON public.t\tUSING (true) '),
    ).toBe('create policy "p" on public.t using (true)')
  })
})
```

`tests/model/fingerprintFinding.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { fingerprintFinding } from '@/model/fingerprintFinding.js'

const base = {
  code: 'BDB001',
  severity: 'warn' as const,
  path: 'supabase/migrations/a.sql',
  message: 'm',
  subject: 'public.t',
}

describe('fingerprintFinding', () => {
  it('is 16 hex characters', () => {
    expect(fingerprintFinding({ ...base, line: 3 }, 'create policy x')).toMatch(
      /^[0-9a-f]{16}$/,
    )
  })
  it('ignores the line number', () => {
    expect(fingerprintFinding({ ...base, line: 3 }, 'ctx')).toBe(
      fingerprintFinding({ ...base, line: 30 }, 'ctx'),
    )
  })
  it('changes with the context, the code and the path', () => {
    const one = fingerprintFinding({ ...base, line: 1 }, 'ctx')
    expect(fingerprintFinding({ ...base, line: 1 }, 'other')).not.toBe(one)
    expect(
      fingerprintFinding({ ...base, code: 'BDB002', line: 1 }, 'ctx'),
    ).not.toBe(one)
    expect(
      fingerprintFinding({ ...base, path: 'b.sql', line: 1 }, 'ctx'),
    ).not.toBe(one)
  })
})
```

`tests/model/compareFindings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'

const make = (path: string, line: number, code: string): Finding => ({
  code,
  severity: 'warn',
  path,
  line,
  message: '',
  subject: '',
  fingerprint: '',
})

describe('compareFindings', () => {
  it('orders by path, then line, then code', () => {
    const sorted = [
      make('b.sql', 1, 'BDB001'),
      make('a.sql', 9, 'BDB002'),
      make('a.sql', 9, 'BDB001'),
      make('a.sql', 2, 'BDB005'),
    ].sort(compareFindings)
    expect(sorted.map((f) => `${f.path}:${f.line}:${f.code}`)).toEqual([
      'a.sql:2:BDB005',
      'a.sql:9:BDB001',
      'a.sql:9:BDB002',
      'b.sql:1:BDB001',
    ])
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `pnpm --filter @syntopica/db-quality exec vitest run tests/model` Expected:
FAIL, modules not found.

- [ ] **Step 3: Implement**

`src/model/Severity.ts`:

```ts
export type Severity = 'error' | 'warn' | 'info'
```

`src/model/Finding.ts`:

```ts
import type { Severity } from '@/model/Severity.js'

/** One reported violation, whatever tool produced it. */
export type Finding = {
  code: string
  severity: Severity
  path: string
  line: number
  message: string
  subject: string
  fingerprint: string
}
```

`src/model/ExitCode.ts`:

```ts
/** The four exit codes the CLI ever returns. A skipped required tool is never OK. */
export const ExitCode = {
  OK: 0,
  FINDINGS: 1,
  CONFIGURATION: 2,
  INFRASTRUCTURE: 3,
} as const
```

`src/model/normalizeSqlText.ts`:

```ts
export const normalizeSqlText = (text: string): string =>
  text.toLowerCase().replaceAll(/\s+/g, ' ').trim()
```

`src/model/fingerprintFinding.ts`:

```ts
import { createHash } from 'node:crypto'

import type { Finding } from '@/model/Finding.js'

// The line is deliberately excluded: a migration inserted above must not
// renew every finding below it. The context (the normalised statement, or the
// tool's message) is what tells two findings on one path apart.
export const fingerprintFinding = (
  finding: Omit<Finding, 'fingerprint'>,
  context: string,
): string =>
  createHash('sha256')
    .update(['1', finding.code, finding.path, context].join('|'))
    .digest('hex')
    .slice(0, 16)
```

`src/model/compareFindings.ts`:

```ts
import type { Finding } from '@/model/Finding.js'

export const compareFindings = (a: Finding, b: Finding): number =>
  a.path.localeCompare(b.path) ||
  a.line - b.line ||
  a.code.localeCompare(b.code)
```

- [ ] **Step 4: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/model && pnpm --filter @syntopica/db-quality lint`
Expected: PASS, 0 lint problems.

```bash
git add packages/db-quality/src/model packages/db-quality/tests/model
git commit -m "feat(db-quality): finding model with line-independent fingerprints"
```

---

### Task 3: Configuration

**Files:**

- Create: `src/config/DbQualityConfig.ts`, `src/config/ConfigError.ts`,
  `src/config/CONFIG_FILENAME.ts`, `src/config/validateConfigDocument.ts`,
  `src/config/readConfig.ts`, `src/config/detectStacks.ts`,
  `src/config/isDisabled.ts`
- Test: `tests/config/validateConfigDocument.test.ts`,
  `tests/config/readConfig.test.ts`, `tests/config/detectStacks.test.ts`,
  `tests/config/isDisabled.test.ts`

**Interfaces:**

- Produces:
  - `type DbQualityConfig = { schemaVersion: 1; supabase?: { migrations: string }; prisma?: { schema: string }; drizzle?: { roots: string[]; objectNames: string[] }; sqlite?: { files: string[] }; audit: { inGate: boolean; bloatThreshold: number; soda?: string }; disable: string[] }`
  - `class ConfigError extends Error`
  - `CONFIG_FILENAME = 'codeality-db.json'`
  - `validateConfigDocument(document: unknown): DbQualityConfig` — throws
    `ConfigError` on unknown keys, wrong types or a missing/other
    `schemaVersion`; fills `audit` and `disable` defaults
  - `readConfig(root: string): DbQualityConfig` — reads
    `<root>/codeality-db.json`; `ConfigError` when absent or invalid JSON
  - `detectStacks(root: string): Omit<DbQualityConfig, 'audit' | 'disable' | 'schemaVersion'>`
    — from the file system: `supabase/migrations/`, `prisma/schema.prisma`,
    `drizzle.config.{ts,js,mjs}` (roots = those of `src`, `server`, `app`,
    `lib`, `db` that exist; objectNames `['db','tx']`),
    `*.db|*.sqlite|*.sqlite3` at depth <= 2 excluding `node_modules`,
    `.codegraph`, `.cocoindex_code`
  - `isDisabled(code: string, disabled: string[]): boolean` — exact match

- [ ] **Step 1: Write the failing tests**

`tests/config/validateConfigDocument.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { ConfigError } from '@/config/ConfigError.js'
import { validateConfigDocument } from '@/config/validateConfigDocument.js'

describe('validateConfigDocument', () => {
  it('fills the defaults', () => {
    expect(
      validateConfigDocument({
        schemaVersion: 1,
        supabase: { migrations: 'supabase/migrations' },
      }),
    ).toEqual({
      schemaVersion: 1,
      supabase: { migrations: 'supabase/migrations' },
      audit: { inGate: true, bloatThreshold: 5 },
      disable: [],
    })
  })
  it.each([
    [{}, /schemaVersion/],
    [{ schemaVersion: 2 }, /schemaVersion/],
    [{ schemaVersion: 1, extra: true }, /unknown key "extra"/],
    [{ schemaVersion: 1, supabase: { migrations: 3 } }, /supabase.migrations/],
    [{ schemaVersion: 1, drizzle: { roots: 'src' } }, /drizzle.roots/],
    [{ schemaVersion: 1, audit: { inGate: 'yes' } }, /audit.inGate/],
    [{ schemaVersion: 1, disable: [1] }, /disable/],
  ])('rejects %j', (document, message) => {
    expect(() => validateConfigDocument(document)).toThrow(ConfigError)
    expect(() => validateConfigDocument(document)).toThrow(message)
  })
})
```

`tests/config/readConfig.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ConfigError } from '@/config/ConfigError.js'
import { readConfig } from '@/config/readConfig.js'

describe('readConfig', () => {
  it('reads codeality-db.json from the root', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, 'codeality-db.json'),
      '{"schemaVersion":1,"sqlite":{"files":["a.db"]}}',
    )
    expect(readConfig(root).sqlite).toEqual({ files: ['a.db'] })
  })
  it('names the missing file', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(() => readConfig(root)).toThrow(ConfigError)
    expect(() => readConfig(root)).toThrow(/codeality-db.json not found/)
  })
  it('reports invalid JSON', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{oops')
    expect(() => readConfig(root)).toThrow(/not valid JSON/)
  })
})
```

`tests/config/detectStacks.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { detectStacks } from '@/config/detectStacks.js'

describe('detectStacks', () => {
  it('detects every stack it knows', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    mkdirSync(join(root, 'prisma'))
    writeFileSync(join(root, 'prisma/schema.prisma'), '')
    writeFileSync(join(root, 'drizzle.config.ts'), '')
    mkdirSync(join(root, 'src'))
    mkdirSync(join(root, 'data'))
    writeFileSync(join(root, 'data/app.db'), '')
    mkdirSync(join(root, 'node_modules/x'), { recursive: true })
    writeFileSync(join(root, 'node_modules/x/ignored.db'), '')
    expect(detectStacks(root)).toEqual({
      supabase: { migrations: 'supabase/migrations' },
      prisma: { schema: 'prisma/schema.prisma' },
      drizzle: { roots: ['src'], objectNames: ['db', 'tx'] },
      sqlite: { files: ['data/app.db'] },
    })
  })
  it('returns nothing for an empty directory', () => {
    expect(detectStacks(mkdtempSync(join(tmpdir(), 'dbq-')))).toEqual({})
  })
})
```

`tests/config/isDisabled.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { isDisabled } from '@/config/isDisabled.js'

describe('isDisabled', () => {
  it('matches the exact code only', () => {
    expect(
      isDisabled('BDB100/prefer-bigint-over-int', [
        'BDB100/prefer-bigint-over-int',
      ]),
    ).toBe(true)
    expect(isDisabled('BDB100/prefer-bigint-over-int', ['BDB100'])).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `pnpm --filter @syntopica/db-quality exec vitest run tests/config`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/config/DbQualityConfig.ts`:

```ts
export type DbQualityConfig = {
  schemaVersion: 1
  supabase?: { migrations: string }
  prisma?: { schema: string }
  drizzle?: { roots: string[]; objectNames: string[] }
  sqlite?: { files: string[] }
  audit: { inGate: boolean; bloatThreshold: number; soda?: string }
  disable: string[]
}
```

`src/config/ConfigError.ts`:

```ts
/** Invalid or missing configuration: exit code 2. */
export class ConfigError extends Error {}
```

`src/config/CONFIG_FILENAME.ts`:

```ts
export const CONFIG_FILENAME = 'codeality-db.json'
```

`src/config/validateConfigDocument.ts`:

```ts
import { ConfigError } from '@/config/ConfigError.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'

const KNOWN = new Set([
  'schemaVersion',
  'supabase',
  'prisma',
  'drizzle',
  'sqlite',
  'audit',
  'disable',
])

export const validateConfigDocument = (document: unknown): DbQualityConfig => {
  if (
    typeof document !== 'object' ||
    document === null ||
    Array.isArray(document)
  )
    throw new ConfigError('configuration must be an object')
  const raw = document as Record<string, unknown>
  for (const key of Object.keys(raw))
    if (!KNOWN.has(key)) throw new ConfigError(`unknown key "${key}"`)
  if (raw['schemaVersion'] !== 1)
    throw new ConfigError('schemaVersion must be 1')
  const isString = (value: unknown): value is string =>
    typeof value === 'string'
  const isStrings = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(isString)
  const section = (name: string): Record<string, unknown> | undefined => {
    const value = raw[name]
    if (value === undefined) return undefined
    if (typeof value !== 'object' || value === null)
      throw new ConfigError(`${name} must be an object`)
    return value as Record<string, unknown>
  }
  const supabase = section('supabase')
  if (supabase && !isString(supabase['migrations']))
    throw new ConfigError('supabase.migrations must be a string')
  const prisma = section('prisma')
  if (prisma && !isString(prisma['schema']))
    throw new ConfigError('prisma.schema must be a string')
  const drizzle = section('drizzle')
  if (drizzle && !isStrings(drizzle['roots']))
    throw new ConfigError('drizzle.roots must be a list of strings')
  if (
    drizzle &&
    drizzle['objectNames'] !== undefined &&
    !isStrings(drizzle['objectNames'])
  )
    throw new ConfigError('drizzle.objectNames must be a list of strings')
  const sqlite = section('sqlite')
  if (sqlite && !isStrings(sqlite['files']))
    throw new ConfigError('sqlite.files must be a list of strings')
  const audit = section('audit') ?? {}
  if (audit['inGate'] !== undefined && typeof audit['inGate'] !== 'boolean')
    throw new ConfigError('audit.inGate must be a boolean')
  if (
    audit['bloatThreshold'] !== undefined &&
    typeof audit['bloatThreshold'] !== 'number'
  )
    throw new ConfigError('audit.bloatThreshold must be a number')
  if (audit['soda'] !== undefined && !isString(audit['soda']))
    throw new ConfigError('audit.soda must be a string')
  if (raw['disable'] !== undefined && !isStrings(raw['disable']))
    throw new ConfigError('disable must be a list of strings')
  return {
    schemaVersion: 1,
    ...(supabase
      ? { supabase: { migrations: supabase['migrations'] as string } }
      : {}),
    ...(prisma ? { prisma: { schema: prisma['schema'] as string } } : {}),
    ...(drizzle
      ? {
          drizzle: {
            roots: drizzle['roots'] as string[],
            objectNames: (drizzle['objectNames'] as string[] | undefined) ?? [
              'db',
              'tx',
            ],
          },
        }
      : {}),
    ...(sqlite ? { sqlite: { files: sqlite['files'] as string[] } } : {}),
    audit: {
      inGate: (audit['inGate'] as boolean | undefined) ?? true,
      bloatThreshold: (audit['bloatThreshold'] as number | undefined) ?? 5,
      ...(audit['soda'] === undefined ? {} : { soda: audit['soda'] as string }),
    },
    disable: (raw['disable'] as string[] | undefined) ?? [],
  }
}
```

(If this file exceeds 100 code lines under the house `max-lines`, move the
`section`, `isString` and `isStrings` closures into
`src/config/configSection.ts`, `src/config/isStringList.ts` as their own
exported units and import them.)

`src/config/readConfig.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import { ConfigError } from '@/config/ConfigError.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { validateConfigDocument } from '@/config/validateConfigDocument.js'

export const readConfig = (root: string): DbQualityConfig => {
  const path = join(root, CONFIG_FILENAME)
  if (!existsSync(path))
    throw new ConfigError(
      `${CONFIG_FILENAME} not found in ${root}; run "codeality-db init"`,
    )
  let document: unknown
  try {
    document = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new ConfigError(
      `${CONFIG_FILENAME} is not valid JSON: ${(error as Error).message}`,
    )
  }
  return validateConfigDocument(document)
}
```

`src/config/detectStacks.ts`:

```ts
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import type { DbQualityConfig } from '@/config/DbQualityConfig.js'

const DRIZZLE_ROOTS = ['src', 'server', 'app', 'lib', 'db']
const SKIPPED = new Set([
  'node_modules',
  '.git',
  '.codegraph',
  '.cocoindex_code',
  'dist',
  'coverage',
])
const SQLITE = /\.(?:db|sqlite|sqlite3)$/

export const detectStacks = (
  root: string,
): Omit<DbQualityConfig, 'audit' | 'disable' | 'schemaVersion'> => {
  const sqliteFiles: string[] = []
  const walk = (directory: string, depth: number): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (SKIPPED.has(entry.name)) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory() && depth < 2) walk(path, depth + 1)
      else if (entry.isFile() && SQLITE.test(entry.name))
        sqliteFiles.push(relative(root, path))
    }
  }
  walk(root, 0)
  const hasDrizzle = ['ts', 'js', 'mjs'].some((ext) =>
    existsSync(join(root, `drizzle.config.${ext}`)),
  )
  return {
    ...(statSyncIsDirectory(join(root, 'supabase/migrations'))
      ? { supabase: { migrations: 'supabase/migrations' } }
      : {}),
    ...(existsSync(join(root, 'prisma/schema.prisma'))
      ? { prisma: { schema: 'prisma/schema.prisma' } }
      : {}),
    ...(hasDrizzle
      ? {
          drizzle: {
            roots: DRIZZLE_ROOTS.filter((name) =>
              statSyncIsDirectory(join(root, name)),
            ),
            objectNames: ['db', 'tx'],
          },
        }
      : {}),
    ...(sqliteFiles.length > 0
      ? { sqlite: { files: sqliteFiles.sort() } }
      : {}),
  }
}

const statSyncIsDirectory = (path: string): boolean =>
  existsSync(path) && statSync(path).isDirectory()
```

`no-hidden-top-level-declarations` forbids the private `statSyncIsDirectory`;
put it in `src/config/isDirectory.ts` as `export const isDirectory = ...` and
import it. Same for `DRIZZLE_ROOTS`, `SKIPPED`, `SQLITE`: inline them into the
function body as `const` locals.

`src/config/isDisabled.ts`:

```ts
export const isDisabled = (code: string, disabled: string[]): boolean =>
  disabled.includes(code)
```

- [ ] **Step 4: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/config && pnpm --filter @syntopica/db-quality lint && pnpm --filter @syntopica/db-quality type-check`
Expected: PASS, clean.

```bash
git add packages/db-quality/src/config packages/db-quality/tests/config
git commit -m "feat(db-quality): configuration file, validation and stack detection"
```

---

### Task 4: SQL statements from migration files

**Files:**

- Create: `src/sql/SqlStatement.ts`, `src/sql/stripSqlComments.ts`,
  `src/sql/splitSqlStatements.ts`, `src/sql/MigrationFile.ts`,
  `src/sql/readMigrationSet.ts`, `src/sql/qualifiedName.ts`,
  `src/sql/statementAtLine.ts`
- Test: `tests/sql/stripSqlComments.test.ts`,
  `tests/sql/splitSqlStatements.test.ts`, `tests/sql/readMigrationSet.test.ts`,
  `tests/sql/qualifiedName.test.ts`, `tests/sql/statementAtLine.test.ts`

**Interfaces:**

- Produces:
  - `type SqlStatement = { text: string; line: number }` — `text` is the
    statement without comments, `line` is the 1-based line of its first token in
    the original file
  - `stripSqlComments(sql: string): string` — removes `-- ...` and `/* ... */`
    outside string and dollar-quoted bodies, keeping newlines so line numbers
    survive
  - `splitSqlStatements(sql: string): SqlStatement[]` — splits on `;` outside
    single-quoted strings, double-quoted identifiers and `$tag$ ... $tag$`
    bodies
  - `type MigrationFile = { path: string; statements: SqlStatement[] }` — `path`
    relative to the project root, POSIX separators
  - `readMigrationSet(root: string, migrationsDir: string): MigrationFile[]` —
    every `*.sql` under the directory, sorted by name
  - `qualifiedName(raw: string): string` — `"public"."Foo"` / `public.foo` /
    `Foo` → `public.foo` (default schema `public`, quotes dropped, lower-cased)
  - `statementAtLine(file: MigrationFile, line: number): SqlStatement | undefined`
    — the statement whose span contains the line (the last statement starting at
    or before it)

- [ ] **Step 1: Write the failing tests**

`tests/sql/stripSqlComments.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { stripSqlComments } from '@/sql/stripSqlComments.js'

describe('stripSqlComments', () => {
  it('removes line and block comments but keeps newlines', () => {
    expect(
      stripSqlComments('select 1; -- one\n/* two\nlines */ select 2;'),
    ).toBe('select 1; \n\n select 2;')
  })
  it('leaves comment markers inside strings and dollar bodies alone', () => {
    const sql =
      "select '--not'; create function f() returns void as $$ -- keep\n/* keep */ $$ language sql;"
    expect(stripSqlComments(sql)).toBe(sql)
  })
})
```

`tests/sql/splitSqlStatements.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

describe('splitSqlStatements', () => {
  it('splits on semicolons and records the first line of each statement', () => {
    expect(
      splitSqlStatements(
        '-- header\ncreate table a (id int);\n\nalter table a\n  enable row level security;',
      ),
    ).toEqual([
      { text: 'create table a (id int)', line: 2 },
      { text: 'alter table a\n  enable row level security', line: 4 },
    ])
  })
  it('does not split inside dollar-quoted bodies, strings or quoted identifiers', () => {
    const sql = `create function f() returns void as $body$ begin perform 1; end; $body$ language plpgsql;\nselect ';';\ncreate table "a;b" (x int);`
    expect(splitSqlStatements(sql).map((s) => s.line)).toEqual([1, 2, 3])
  })
  it('ignores a trailing fragment without a semicolon that is blank', () => {
    expect(splitSqlStatements('select 1;\n  \n')).toHaveLength(1)
  })
  it('keeps a trailing statement that has no semicolon', () => {
    expect(splitSqlStatements('select 1;\nselect 2')).toHaveLength(2)
  })
})
```

`tests/sql/readMigrationSet.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readMigrationSet } from '@/sql/readMigrationSet.js'

describe('readMigrationSet', () => {
  it('reads every .sql file in name order with root-relative POSIX paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    writeFileSync(join(root, 'supabase/migrations/2_b.sql'), 'select 2;')
    writeFileSync(join(root, 'supabase/migrations/1_a.sql'), 'select 1;')
    writeFileSync(join(root, 'supabase/migrations/notes.md'), 'x')
    const set = readMigrationSet(root, 'supabase/migrations')
    expect(set.map((file) => file.path)).toEqual([
      'supabase/migrations/1_a.sql',
      'supabase/migrations/2_b.sql',
    ])
    expect(set[0]?.statements).toEqual([{ text: 'select 1', line: 1 }])
  })
})
```

`tests/sql/qualifiedName.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { qualifiedName } from '@/sql/qualifiedName.js'

describe('qualifiedName', () => {
  it.each([
    ['public.users', 'public.users'],
    ['"public"."Users"', 'public.users'],
    ['Users', 'public.users'],
    ['auth.users', 'auth.users'],
  ])('%s -> %s', (raw, expected) => {
    expect(qualifiedName(raw)).toBe(expected)
  })
})
```

`tests/sql/statementAtLine.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { statementAtLine } from '@/sql/statementAtLine.js'

const file = {
  path: 'a.sql',
  statements: [
    { text: 'select 1', line: 1 },
    { text: 'select\n2', line: 4 },
  ],
}

describe('statementAtLine', () => {
  it('returns the statement covering the line', () => {
    expect(statementAtLine(file, 5)?.line).toBe(4)
    expect(statementAtLine(file, 2)?.line).toBe(1)
  })
  it('returns undefined before the first statement', () => {
    expect(statementAtLine(file, 0)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `pnpm --filter @syntopica/db-quality exec vitest run tests/sql` Expected:
FAIL.

- [ ] **Step 3: Implement**

`src/sql/SqlStatement.ts`:

```ts
export type SqlStatement = { text: string; line: number }
```

`src/sql/stripSqlComments.ts` — a single scanner that knows the four contexts
(plain, single-quoted string, double-quoted identifier, dollar body) and blanks
comments:

```ts
// Comments become spaces (newlines kept) so that the line numbers of what
// follows are unchanged. Strings, quoted identifiers and dollar-quoted
// bodies are copied through untouched: a `--` inside them is data.
export const stripSqlComments = (sql: string): string => {
  let out = ''
  let index = 0
  while (index < sql.length) {
    const rest = sql.slice(index)
    const dollar = /^\$[A-Za-z_]*\$/.exec(rest)
    if (dollar) {
      const end = sql.indexOf(dollar[0], index + dollar[0].length)
      const stop = end === -1 ? sql.length : end + dollar[0].length
      out += sql.slice(index, stop)
      index = stop
    } else if (rest.startsWith("'") || rest.startsWith('"')) {
      const quote = rest[0] as string
      let stop = index + 1
      while (stop < sql.length && sql[stop] !== quote) stop += 1
      out += sql.slice(index, stop + 1)
      index = stop + 1
    } else if (rest.startsWith('--')) {
      const end = sql.indexOf('\n', index)
      index = end === -1 ? sql.length : end
    } else if (rest.startsWith('/*')) {
      const end = sql.indexOf('*/', index + 2)
      const stop = end === -1 ? sql.length : end + 2
      out += sql.slice(index, stop).replaceAll(/[^\n]/g, '')
      index = stop
    } else {
      out += sql[index]
      index += 1
    }
  }
  return out
}
```

`src/sql/splitSqlStatements.ts` — same scanner, but splitting on `;`:

```ts
import type { SqlStatement } from '@/sql/SqlStatement.js'
import { stripSqlComments } from '@/sql/stripSqlComments.js'

export const splitSqlStatements = (sql: string): SqlStatement[] => {
  const text = stripSqlComments(sql)
  const statements: SqlStatement[] = []
  let start = 0
  let index = 0
  const flush = (end: number): void => {
    const raw = text.slice(start, end)
    const leading = raw.length - raw.trimStart().length
    const body = raw.trim()
    if (body)
      statements.push({
        text: body,
        line: 1 + (text.slice(0, start + leading).match(/\n/g)?.length ?? 0),
      })
    start = end + 1
  }
  while (index < text.length) {
    const rest = text.slice(index)
    const dollar = /^\$[A-Za-z_]*\$/.exec(rest)
    if (dollar) {
      const end = text.indexOf(dollar[0], index + dollar[0].length)
      index = end === -1 ? text.length : end + dollar[0].length
    } else if (rest.startsWith("'") || rest.startsWith('"')) {
      const quote = rest[0] as string
      let stop = index + 1
      while (stop < text.length && text[stop] !== quote) stop += 1
      index = stop + 1
    } else if (rest.startsWith(';')) {
      flush(index)
      index += 1
    } else index += 1
  }
  flush(text.length)
  return statements
}
```

`src/sql/MigrationFile.ts`:

```ts
import type { SqlStatement } from '@/sql/SqlStatement.js'

export type MigrationFile = { path: string; statements: SqlStatement[] }
```

`src/sql/readMigrationSet.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { MigrationFile } from '@/sql/MigrationFile.js'
import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

export const readMigrationSet = (
  root: string,
  migrationsDir: string,
): MigrationFile[] =>
  readdirSync(join(root, migrationsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => ({
      path: `${migrationsDir.replaceAll('\\', '/')}/${name}`,
      statements: splitSqlStatements(
        readFileSync(join(root, migrationsDir, name), 'utf8'),
      ),
    }))
```

`src/sql/qualifiedName.ts`:

```ts
export const qualifiedName = (raw: string): string => {
  const parts = raw
    .trim()
    .split('.')
    .map((part) => part.replaceAll('"', '').toLowerCase())
  return parts.length === 1 ? `public.${parts[0]}` : parts.join('.')
}
```

`src/sql/statementAtLine.ts`:

```ts
import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'

export const statementAtLine = (
  file: MigrationFile,
  line: number,
): SqlStatement | undefined =>
  [...file.statements].reverse().find((statement) => statement.line <= line)
```

- [ ] **Step 4: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/sql && pnpm --filter @syntopica/db-quality lint`
Expected: PASS.

```bash
git add packages/db-quality/src/sql packages/db-quality/tests/sql
git commit -m "feat(db-quality): comment-aware SQL statement splitter for migration sets"
```

---

### Task 5: The five SQL rules

**Files:**

- Create: `src/rules/SqlRule.ts`, `src/rules/makeSqlFinding.ts`,
  `src/rules/policyTable.ts`, `src/rules/createdTables.ts`,
  `src/rules/rlsEnabledTables.ts`, `src/rules/policyTables.ts`,
  `src/rules/permissivePolicy.ts`, `src/rules/rlsEnabledNoPolicy.ts`,
  `src/rules/tableWithoutRls.ts`, `src/rules/authUidNotWrapped.ts`,
  `src/rules/definerWithoutSearchPath.ts`, `src/rules/SQL_RULES.ts`,
  `src/rules/runSqlRules.ts`
- Test: `tests/rules/permissivePolicy.test.ts`,
  `tests/rules/rlsEnabledNoPolicy.test.ts`,
  `tests/rules/tableWithoutRls.test.ts`,
  `tests/rules/authUidNotWrapped.test.ts`,
  `tests/rules/definerWithoutSearchPath.test.ts`,
  `tests/rules/runSqlRules.test.ts`, fixtures under `tests/fixtures/migrations/`
- Test helper: `tests/rules/migrationSetFrom.ts` (builds a `MigrationFile[]`
  from `{ path: sql }`)

**Interfaces:**

- Consumes: `MigrationFile`, `SqlStatement`, `qualifiedName`,
  `normalizeSqlText`, `fingerprintFinding`, `Finding`, `Severity`.
- Produces:
  - `type SqlRule = { code: string; name: string; severity: Severity; run: (set: MigrationFile[]) => Finding[] }`
  - `makeSqlFinding(rule: Pick<SqlRule, 'code' | 'severity'>, file: MigrationFile, statement: SqlStatement, subject: string, message: string): Finding`
    — fingerprint context is `normalizeSqlText(statement.text)`
  - `policyTable(statement: SqlStatement): string | undefined` —
    `create policy ... on <table>` → qualified name
  - `createdTables(set): Map<string, { file: MigrationFile; statement: SqlStatement }>`
    — tables created in `public` (`create table [if not exists] <name>`), schema
    `public` only
  - `rlsEnabledTables(set): Map<string, { file; statement }>` —
    `alter table [if exists] [only] <name> enable row level security`
  - `policyTables(set): Set<string>`
  - `SQL_RULES: SqlRule[]` in code order
  - `runSqlRules(set: MigrationFile[], disabled: string[]): Finding[]` — sorted
    with `compareFindings`

Rule semantics (all matching is on `normalizeSqlText(statement.text)`):

| Code                                 | Severity | Fires when                                                                                                                                                                                       |
| ------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BDB001 permissive-policy`           | warn     | statement starts with `create policy` and contains `using (true)` or `with check (true)`                                                                                                         |
| `BDB002 rls-enabled-no-policy`       | info     | a table in `rlsEnabledTables` is not in `policyTables`; reported at the enabling statement                                                                                                       |
| `BDB003 table-without-rls`           | warn     | a table in `createdTables` is not in `rlsEnabledTables`; reported at the create statement                                                                                                        |
| `BDB004 auth-uid-not-wrapped`        | warn     | statement starts with `create policy` and contains `auth.uid()` or `auth.jwt()` not immediately preceded by `(select ` (after normalisation: `(select auth.uid()`)                               |
| `BDB005 definer-without-search-path` | warn     | statement starts with `create function`, `create or replace function`, `create procedure` or `create or replace procedure`, contains ` security definer`, and does not contain `set search_path` |

Subjects: the qualified table for 001-004, the function name (text between
`function ` and `(`, qualified) for 005.

- [ ] **Step 1: Write the fixtures and the helper**

`tests/rules/migrationSetFrom.ts`:

```ts
import type { MigrationFile } from '@/sql/MigrationFile.js'
import { splitSqlStatements } from '@/sql/splitSqlStatements.js'

export const migrationSetFrom = (
  files: Record<string, string>,
): MigrationFile[] =>
  Object.entries(files).map(([path, sql]) => ({
    path,
    statements: splitSqlStatements(sql),
  }))
```

`tests/fixtures/migrations/permissive.sql`:

```sql
create policy "anyone reads" on public.profiles for select using (true);
CREATE POLICY "Anyone can insert" ON public.chat_profiles FOR INSERT WITH CHECK (true);
create policy "members" on public.orgs for select using (auth.uid() = owner_id);
```

`tests/fixtures/migrations/rls_set_a.sql`:

```sql
create table public.with_policy (id int);
alter table public.with_policy enable row level security;
create policy "p" on public.with_policy for select using ((select auth.uid()) = id);
create table if not exists public.service_only (id int);
alter table public.service_only enable row level security;
create table "public"."Naked" (id int);
create table private.internal (id int);
```

`tests/fixtures/migrations/rls_set_b.sql`:

```sql
alter table public."Naked" enable row level security;
create policy "later" on "Naked" for select using (true);
```

`tests/fixtures/migrations/definer.sql`:

```sql
create or replace function public.safe() returns void language plpgsql security definer set search_path = public as $$ begin end $$;
create function public.unsafe() returns void language plpgsql security definer as $$ begin end $$;
create or replace function public.invoker() returns void language sql as $$ select 1 $$;
```

- [ ] **Step 2: Write the failing tests**

`tests/rules/permissivePolicy.test.ts`:

```ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { permissivePolicy } from '@/rules/permissivePolicy.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const set = migrationSetFrom({
  'm/permissive.sql': readFileSync(
    new URL('../fixtures/migrations/permissive.sql', import.meta.url),
    'utf8',
  ),
})

describe('permissivePolicy', () => {
  it('flags using (true) and with check (true), not a real predicate', () => {
    const findings = permissivePolicy.run(set)
    expect(findings.map((f) => [f.line, f.subject])).toEqual([
      [1, 'public.profiles'],
      [2, 'public.chat_profiles'],
    ])
    expect(findings[0]).toMatchObject({
      code: 'BDB001',
      severity: 'warn',
      path: 'm/permissive.sql',
    })
    expect(findings[0]?.fingerprint).toMatch(/^[0-9a-f]{16}$/)
  })
})
```

`tests/rules/rlsEnabledNoPolicy.test.ts` and
`tests/rules/tableWithoutRls.test.ts` load `rls_set_a.sql` and `rls_set_b.sql`
together:

```ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { rlsEnabledNoPolicy } from '@/rules/rlsEnabledNoPolicy.js'
import { tableWithoutRls } from '@/rules/tableWithoutRls.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const read = (name: string): string =>
  readFileSync(
    new URL(`../fixtures/migrations/${name}`, import.meta.url),
    'utf8',
  )
const set = migrationSetFrom({
  'm/a.sql': read('rls_set_a.sql'),
  'm/b.sql': read('rls_set_b.sql'),
})

describe('rlsEnabledNoPolicy', () => {
  it('reports the table whose RLS is on with no policy anywhere in the set', () => {
    expect(
      rlsEnabledNoPolicy
        .run(set)
        .map((f) => [f.path, f.line, f.subject, f.severity]),
    ).toEqual([['m/a.sql', 5, 'public.service_only', 'info']])
  })
})

describe('tableWithoutRls', () => {
  it('reports only public tables never enabled in any migration', () => {
    const onlyA = migrationSetFrom({ 'm/a.sql': read('rls_set_a.sql') })
    expect(tableWithoutRls.run(onlyA).map((f) => f.subject)).toEqual([
      'public.naked',
    ])
    expect(tableWithoutRls.run(set)).toEqual([])
  })
})
```

(Split into the two files named above; each keeps its own `describe`.)

`tests/rules/authUidNotWrapped.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { authUidNotWrapped } from '@/rules/authUidNotWrapped.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

describe('authUidNotWrapped', () => {
  it('flags a bare auth.uid() in a policy and accepts the wrapped form', () => {
    const set = migrationSetFrom({
      'm.sql': [
        'create policy "a" on public.t for select using (user_id = auth.uid());',
        'create policy "b" on public.t for select using (user_id = (select auth.uid()));',
        "create policy \"c\" on public.t for select using ((select auth.jwt()) ->> 'role' = 'admin');",
        "create policy \"d\" on public.t for select using (auth.jwt() ->> 'role' = 'admin');",
        'create function public.f() returns uuid as $$ select auth.uid() $$ language sql;',
      ].join('\n'),
    })
    expect(authUidNotWrapped.run(set).map((f) => f.line)).toEqual([1, 4])
  })
})
```

`tests/rules/definerWithoutSearchPath.test.ts`:

```ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { definerWithoutSearchPath } from '@/rules/definerWithoutSearchPath.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

describe('definerWithoutSearchPath', () => {
  it('flags the definer function that does not pin search_path', () => {
    const set = migrationSetFrom({
      'm.sql': readFileSync(
        new URL('../fixtures/migrations/definer.sql', import.meta.url),
        'utf8',
      ),
    })
    expect(
      definerWithoutSearchPath.run(set).map((f) => [f.line, f.subject]),
    ).toEqual([[2, 'public.unsafe']])
  })
})
```

`tests/rules/runSqlRules.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { runSqlRules } from '@/rules/runSqlRules.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const set = migrationSetFrom({
  'm.sql':
    'create table public.t (id int);\ncreate policy "p" on public.t using (true);',
})

describe('runSqlRules', () => {
  it('runs every rule and sorts by path, line, code', () => {
    expect(runSqlRules(set, []).map((f) => f.code)).toEqual([
      'BDB003',
      'BDB001',
    ])
  })
  it('honours the disable list', () => {
    expect(runSqlRules(set, ['BDB003']).map((f) => f.code)).toEqual(['BDB001'])
  })
})
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `pnpm --filter @syntopica/db-quality exec vitest run tests/rules` Expected:
FAIL.

- [ ] **Step 4: Implement**

`src/rules/SqlRule.ts`:

```ts
import type { Finding } from '@/model/Finding.js'
import type { Severity } from '@/model/Severity.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

export type SqlRule = {
  code: string
  name: string
  severity: Severity
  run: (set: MigrationFile[]) => Finding[]
}
```

`src/rules/makeSqlFinding.ts`:

```ts
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import type { SqlRule } from '@/rules/SqlRule.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'

export const makeSqlFinding = (
  rule: Pick<SqlRule, 'code' | 'severity'>,
  file: MigrationFile,
  statement: SqlStatement,
  subject: string,
  message: string,
): Finding => {
  const partial = {
    code: rule.code,
    severity: rule.severity,
    path: file.path,
    line: statement.line,
    message,
    subject,
  }
  return {
    ...partial,
    fingerprint: fingerprintFinding(partial, normalizeSqlText(statement.text)),
  }
}
```

`src/rules/policyTable.ts`:

```ts
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { qualifiedName } from '@/sql/qualifiedName.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'

export const policyTable = (statement: SqlStatement): string | undefined => {
  const match =
    /^create policy .+? on ((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)/.exec(
      normalizeSqlText(statement.text),
    )
  return match?.[1] === undefined ? undefined : qualifiedName(match[1])
}
```

`src/rules/createdTables.ts`:

```ts
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import { qualifiedName } from '@/sql/qualifiedName.js'
import type { SqlStatement } from '@/sql/SqlStatement.js'

export const createdTables = (
  set: MigrationFile[],
): Map<string, { file: MigrationFile; statement: SqlStatement }> => {
  const tables = new Map<
    string,
    { file: MigrationFile; statement: SqlStatement }
  >()
  for (const file of set)
    for (const statement of file.statements) {
      const match =
        /^create (?:unlogged |temp(?:orary)? )?table (?:if not exists )?((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)/.exec(
          normalizeSqlText(statement.text),
        )
      if (!match?.[1]) continue
      const name = qualifiedName(match[1])
      if (name.startsWith('public.') && !tables.has(name))
        tables.set(name, { file, statement })
    }
  return tables
}
```

`src/rules/rlsEnabledTables.ts`: same shape with the pattern
`/^alter table (?:if exists )?(?:only )?((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?) enable row level security/`
and no schema filter.

`src/rules/policyTables.ts`:

```ts
import { policyTable } from '@/rules/policyTable.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

export const policyTables = (set: MigrationFile[]): Set<string> => {
  const tables = new Set<string>()
  for (const file of set)
    for (const statement of file.statements) {
      const table = policyTable(statement)
      if (table) tables.add(table)
    }
  return tables
}
```

`src/rules/permissivePolicy.ts`:

```ts
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import { policyTable } from '@/rules/policyTable.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const permissivePolicy: SqlRule = {
  code: 'BDB001',
  name: 'permissive-policy',
  severity: 'warn',
  run: (set) =>
    set.flatMap((file) =>
      file.statements
        .filter((statement) => {
          const text = normalizeSqlText(statement.text)
          return (
            text.startsWith('create policy') &&
            /(?:using|with check) \( ?true ?\)/.test(text)
          )
        })
        .map((statement) =>
          makeSqlFinding(
            permissivePolicy,
            file,
            statement,
            policyTable(statement) ?? '',
            'policy is permissive: using (true) or with check (true) lets every row through for the granted role',
          ),
        ),
    ),
}
```

`src/rules/rlsEnabledNoPolicy.ts`:

```ts
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import { policyTables } from '@/rules/policyTables.js'
import { rlsEnabledTables } from '@/rules/rlsEnabledTables.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const rlsEnabledNoPolicy: SqlRule = {
  code: 'BDB002',
  name: 'rls-enabled-no-policy',
  severity: 'info',
  run: (set) => {
    const withPolicy = policyTables(set)
    return [...rlsEnabledTables(set)]
      .filter(([table]) => !withPolicy.has(table))
      .map(([table, { file, statement }]) =>
        makeSqlFinding(
          rlsEnabledNoPolicy,
          file,
          statement,
          table,
          'RLS is enabled but no migration defines a policy: only the service role can reach this table',
        ),
      )
  },
}
```

`src/rules/tableWithoutRls.ts`:

```ts
import { createdTables } from '@/rules/createdTables.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import { rlsEnabledTables } from '@/rules/rlsEnabledTables.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const tableWithoutRls: SqlRule = {
  code: 'BDB003',
  name: 'table-without-rls',
  severity: 'warn',
  run: (set) => {
    const enabled = rlsEnabledTables(set)
    return [...createdTables(set)]
      .filter(([table]) => !enabled.has(table))
      .map(([table, { file, statement }]) =>
        makeSqlFinding(
          tableWithoutRls,
          file,
          statement,
          table,
          'table in public never enables row level security: it is readable through the Data API by anyone holding the anon key',
        ),
      )
  },
}
```

`src/rules/authUidNotWrapped.ts`:

```ts
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import { policyTable } from '@/rules/policyTable.js'
import type { SqlRule } from '@/rules/SqlRule.js'

export const authUidNotWrapped: SqlRule = {
  code: 'BDB004',
  name: 'auth-uid-not-wrapped',
  severity: 'warn',
  run: (set) =>
    set.flatMap((file) =>
      file.statements
        .filter((statement) => {
          const text = normalizeSqlText(statement.text)
          return (
            text.startsWith('create policy') &&
            /(?<!\(select )auth\.(?:uid|jwt)\(\)/.test(text)
          )
        })
        .map((statement) =>
          makeSqlFinding(
            authUidNotWrapped,
            file,
            statement,
            policyTable(statement) ?? '',
            'auth.uid() or auth.jwt() is re-evaluated per row; wrap it as (select auth.uid()) so Postgres caches it as an initplan',
          ),
        ),
    ),
}
```

`src/rules/definerWithoutSearchPath.ts`:

```ts
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import { makeSqlFinding } from '@/rules/makeSqlFinding.js'
import type { SqlRule } from '@/rules/SqlRule.js'
import { qualifiedName } from '@/sql/qualifiedName.js'

export const definerWithoutSearchPath: SqlRule = {
  code: 'BDB005',
  name: 'definer-without-search-path',
  severity: 'warn',
  run: (set) =>
    set.flatMap((file) =>
      file.statements.flatMap((statement) => {
        const text = normalizeSqlText(statement.text)
        const head =
          /^create (?:or replace )?(?:function|procedure) ((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)\s*\(/.exec(
            text,
          )
        if (
          !head?.[1] ||
          !/ security definer/.test(text) ||
          / set search_path/.test(text)
        )
          return []
        return [
          makeSqlFinding(
            definerWithoutSearchPath,
            file,
            statement,
            qualifiedName(head[1]),
            'SECURITY DEFINER function without "set search_path": a caller can shadow the objects it touches',
          ),
        ]
      }),
    ),
}
```

`src/rules/SQL_RULES.ts`:

```ts
import { authUidNotWrapped } from '@/rules/authUidNotWrapped.js'
import { definerWithoutSearchPath } from '@/rules/definerWithoutSearchPath.js'
import { permissivePolicy } from '@/rules/permissivePolicy.js'
import { rlsEnabledNoPolicy } from '@/rules/rlsEnabledNoPolicy.js'
import type { SqlRule } from '@/rules/SqlRule.js'
import { tableWithoutRls } from '@/rules/tableWithoutRls.js'

export const SQL_RULES: SqlRule[] = [
  permissivePolicy,
  rlsEnabledNoPolicy,
  tableWithoutRls,
  authUidNotWrapped,
  definerWithoutSearchPath,
]
```

`src/rules/runSqlRules.ts`:

```ts
import { isDisabled } from '@/config/isDisabled.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'
import { SQL_RULES } from '@/rules/SQL_RULES.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

export const runSqlRules = (
  set: MigrationFile[],
  disabled: string[],
): Finding[] =>
  SQL_RULES.filter((rule) => !isDisabled(rule.code, disabled))
    .flatMap((rule) => rule.run(set))
    .sort(compareFindings)
```

- [ ] **Step 5: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/rules && pnpm --filter @syntopica/db-quality lint`
Expected: PASS. If `permissivePolicy` fails on the fixture's second line, check
that `normalizeSqlText` lower-cases `WITH CHECK (true)` to `with check (true)`
before the regex runs.

```bash
git add packages/db-quality/src/rules packages/db-quality/tests/rules packages/db-quality/tests/fixtures/migrations
git commit -m "feat(db-quality): five static RLS and definer rules over the migration set"
```

---

### Task 6: Command runner

**Files:**

- Create: `src/tools/CommandResult.ts`, `src/tools/CommandRunner.ts`,
  `src/tools/ToolMissingError.ts`, `src/tools/spawnRunner.ts`
- Test: `tests/tools/spawnRunner.test.ts`

**Interfaces:**

- Produces:
  - `type CommandResult = { status: number; stdout: string; stderr: string; missing: boolean }`
  - `type CommandRunner = (command: string, args: string[], options: { cwd: string; env?: Record<string, string> }) => CommandResult`
  - `class ToolMissingError extends Error { constructor(tool: string, hint: string) }`
    — message `"<tool> is not installed or not on PATH; <hint>"`
  - `spawnRunner: CommandRunner` — `spawnSync` with `encoding: 'utf8'`,
    `maxBuffer: 64 * 1024 * 1024`, `PATH` prefixed with
    `<cwd>/node_modules/.bin`; `missing` when `error.code === 'ENOENT'`;
    `status` is `-1` when the process was killed

- [ ] **Step 1: Write the failing test**

`tests/tools/spawnRunner.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { spawnRunner } from '@/tools/spawnRunner.js'

describe('spawnRunner', () => {
  it('captures stdout, stderr and the status', () => {
    const result = spawnRunner(
      'node',
      ['-e', 'console.log("out"); console.error("err"); process.exit(3)'],
      { cwd: process.cwd() },
    )
    expect(result).toEqual({
      status: 3,
      stdout: 'out\n',
      stderr: 'err\n',
      missing: false,
    })
  })
  it('reports a missing executable instead of throwing', () => {
    expect(
      spawnRunner('definitely-not-a-command-xyz', [], { cwd: process.cwd() })
        .missing,
    ).toBe(true)
  })
  it('puts node_modules/.bin of the cwd first on PATH', () => {
    const result = spawnRunner(
      'node',
      [
        '-e',
        'console.log(process.env.PATH.split(require("node:path").delimiter)[0])',
      ],
      { cwd: '/tmp/project' },
    )
    expect(result.stdout.trim()).toBe('/tmp/project/node_modules/.bin')
  })
})
```

- [ ] **Step 2: Run the test to see it fail**

Run: `pnpm --filter @syntopica/db-quality exec vitest run tests/tools` Expected:
FAIL.

- [ ] **Step 3: Implement**

`src/tools/CommandResult.ts`:

```ts
export type CommandResult = {
  status: number
  stdout: string
  stderr: string
  missing: boolean
}
```

`src/tools/CommandRunner.ts`:

```ts
import type { CommandResult } from '@/tools/CommandResult.js'

/** Every external tool goes through one of these, so tests can hand back saved output. */
export type CommandRunner = (
  command: string,
  args: string[],
  options: { cwd: string; env?: Record<string, string> },
) => CommandResult
```

`src/tools/ToolMissingError.ts`:

```ts
/** A required executable is absent: exit code 3, never a skip. */
export class ToolMissingError extends Error {
  constructor(tool: string, hint: string) {
    super(`${tool} is not installed or not on PATH; ${hint}`)
  }
}
```

`src/tools/spawnRunner.ts`:

```ts
import { spawnSync } from 'node:child_process'
import { delimiter, join } from 'node:path'
import { env as processEnv } from 'node:process'

import type { CommandRunner } from '@/tools/CommandRunner.js'

export const spawnRunner: CommandRunner = (command, args, options) => {
  const path = [
    join(options.cwd, 'node_modules/.bin'),
    processEnv['PATH'] ?? '',
  ].join(delimiter)
  const child = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...processEnv, ...options.env, PATH: path },
  })
  const missing =
    (child.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT'
  return {
    status: child.status ?? -1,
    stdout: child.stdout ?? '',
    stderr: child.stderr ?? '',
    missing,
  }
}
```

- [ ] **Step 4: Run the test, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/tools && pnpm --filter @syntopica/db-quality lint`
Expected: PASS.

```bash
git add packages/db-quality/src/tools packages/db-quality/tests/tools
git commit -m "feat(db-quality): injectable command runner for external tools"
```

---

### Task 7: Squawk adapter

**Files:**

- Create: `src/adapters/squawk/SUPABASE_SQUAWK_EXCLUDES.ts`,
  `src/adapters/squawk/SquawkEntry.ts`,
  `src/adapters/squawk/parseSquawkReport.ts`, `src/adapters/squawk/runSquawk.ts`
- Test: `tests/adapters/squawk/parseSquawkReport.test.ts`,
  `tests/adapters/squawk/runSquawk.test.ts`,
  `tests/adapters/squawk/runSquawk.integration.test.ts`, fixture
  `tests/fixtures/reports/squawk.json`

**Interfaces:**

- Consumes: `CommandRunner`, `ToolMissingError`, `MigrationFile`,
  `statementAtLine`, `normalizeSqlText`, `fingerprintFinding`, `isDisabled`.
- Produces:
  - `SUPABASE_SQUAWK_EXCLUDES = ['prefer-robust-stmts', 'require-lock-timeout', 'require-statement-timeout', 'require-concurrent-index-creation']`
  - `type SquawkEntry = { file: string; line: number; level: 'Warning' | 'Error'; message: string; rule_name: string }`
  - `parseSquawkReport(stdout: string, set: MigrationFile[], disabled: string[]): Finding[]`
    — code `BDB100/<rule_name>`, severity `warn` for `Warning`, `error` for
    `Error`, path as squawk printed it, subject `rule_name`, fingerprint context
    = normalised statement at that line (message when no statement covers it);
    disabled codes dropped; an empty or whitespace stdout is no findings;
    invalid JSON throws
    `Error('squawk produced no JSON report: <first 200 chars>')`
  - `runSquawk(runner: CommandRunner, root: string, set: MigrationFile[], disabled: string[]): Finding[]`
    — runs
    `squawk --reporter json --exclude <excludes joined by comma> <every file path>`
    in `root`; `missing` →
    `ToolMissingError('squawk', 'add squawk-cli as a devDependency')`; status
    other than 0 or 1 with no JSON → `Error` with stderr

- [ ] **Step 1: Save the fixture**

Run from the monorepo root, and commit the result:

```bash
(cd ~/p/verticagtm && npx -y squawk-cli --reporter json --exclude prefer-robust-stmts,require-lock-timeout,require-statement-timeout,require-concurrent-index-creation supabase/migrations/20260508000000_initial_schema.sql) > packages/db-quality/tests/fixtures/reports/squawk.json
```

The file holds two `prefer-bigint-over-int` warnings (line 14 and one later
line) on `supabase/migrations/20260508000000_initial_schema.sql`. Replace the
`message` and `help` texts with `"m"` and `"h"` if they name project tables;
keep `file`, `line`, `level`, `rule_name`.

- [ ] **Step 2: Write the failing tests**

`tests/adapters/squawk/parseSquawkReport.test.ts`:

```ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { parseSquawkReport } from '@/adapters/squawk/parseSquawkReport.js'

const stdout = readFileSync(
  new URL('../../fixtures/reports/squawk.json', import.meta.url),
  'utf8',
)
const set = [
  {
    path: 'supabase/migrations/20260508000000_initial_schema.sql',
    statements: [{ text: 'create table public.a (id serial)', line: 14 }],
  },
]

describe('parseSquawkReport', () => {
  it('maps entries to BDB100 findings with the statement as fingerprint context', () => {
    const findings = parseSquawkReport(stdout, set, [])
    expect(findings).toHaveLength(2)
    expect(findings[0]).toMatchObject({
      code: 'BDB100/prefer-bigint-over-int',
      severity: 'warn',
      line: 14,
      subject: 'prefer-bigint-over-int',
    })
  })
  it('drops disabled codes', () => {
    expect(
      parseSquawkReport(stdout, set, ['BDB100/prefer-bigint-over-int']),
    ).toEqual([])
  })
  it('treats empty output as no findings and rejects non-JSON', () => {
    expect(parseSquawkReport('  \n', set, [])).toEqual([])
    expect(() => parseSquawkReport('error: boom', set, [])).toThrow(
      /no JSON report/,
    )
  })
})
```

`tests/adapters/squawk/runSquawk.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { runSquawk } from '@/adapters/squawk/runSquawk.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

const set = [{ path: 'supabase/migrations/1.sql', statements: [] }]

describe('runSquawk', () => {
  it('passes the Supabase excludes and every file', () => {
    const calls: string[][] = []
    const runner: CommandRunner = (command, args) => {
      calls.push([command, ...args])
      return { status: 0, stdout: '[]', stderr: '', missing: false }
    }
    expect(runSquawk(runner, '/p', set, [])).toEqual([])
    expect(calls[0]).toEqual([
      'squawk',
      '--reporter',
      'json',
      '--exclude',
      'prefer-robust-stmts,require-lock-timeout,require-statement-timeout,require-concurrent-index-creation',
      'supabase/migrations/1.sql',
    ])
  })
  it('raises ToolMissingError when squawk is absent', () => {
    const runner: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() => runSquawk(runner, '/p', set, [])).toThrow(ToolMissingError)
  })
  it('surfaces a crash with its stderr', () => {
    const runner: CommandRunner = () => ({
      status: 101,
      stdout: '',
      stderr: 'panic',
      missing: false,
    })
    expect(() => runSquawk(runner, '/p', set, [])).toThrow(
      /squawk exited 101: panic/,
    )
  })
})
```

`tests/adapters/squawk/runSquawk.integration.test.ts` (skipped when the binary
is absent):

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runSquawk } from '@/adapters/squawk/runSquawk.js'
import { readMigrationSet } from '@/sql/readMigrationSet.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('squawk', ['--version'], { cwd: process.cwd() })
  .missing

describe.skipIf(!installed)('runSquawk with the real binary', () => {
  it('reports prefer-bigint-over-int on an int primary key', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'm'))
    writeFileSync(join(root, 'm/1.sql'), 'create table t (id int primary key);')
    const findings = runSquawk(
      spawnRunner,
      root,
      readMigrationSet(root, 'm'),
      [],
    )
    expect(findings.map((f) => f.code)).toContain(
      'BDB100/prefer-bigint-over-int',
    )
  })
})
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/squawk`
Expected: FAIL.

- [ ] **Step 4: Implement**

`src/adapters/squawk/SUPABASE_SQUAWK_EXCLUDES.ts`:

```ts
// Supabase applies each migration inside one transaction with the CLI's own
// timeouts, so the lock, timeout and CONCURRENTLY rules describe a deployment
// model these projects do not have. Measured 2026-09-25 over six repositories:
// these four were 80% of every squawk line and none of them was actionable.
export const SUPABASE_SQUAWK_EXCLUDES = [
  'prefer-robust-stmts',
  'require-lock-timeout',
  'require-statement-timeout',
  'require-concurrent-index-creation',
]
```

`src/adapters/squawk/SquawkEntry.ts`:

```ts
export type SquawkEntry = {
  file: string
  line: number
  level: 'Warning' | 'Error'
  message: string
  rule_name: string
}
```

`src/adapters/squawk/parseSquawkReport.ts`:

```ts
import type { SquawkEntry } from '@/adapters/squawk/SquawkEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'
import { normalizeSqlText } from '@/model/normalizeSqlText.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import { statementAtLine } from '@/sql/statementAtLine.js'

export const parseSquawkReport = (
  stdout: string,
  set: MigrationFile[],
  disabled: string[],
): Finding[] => {
  if (!stdout.trim()) return []
  let entries: SquawkEntry[]
  try {
    entries = JSON.parse(stdout) as SquawkEntry[]
  } catch {
    throw new Error(`squawk produced no JSON report: ${stdout.slice(0, 200)}`)
  }
  return entries.flatMap((entry) => {
    const code = `BDB100/${entry.rule_name}`
    if (isDisabled(code, disabled)) return []
    const file = set.find((candidate) => candidate.path === entry.file)
    const statement = file ? statementAtLine(file, entry.line) : undefined
    const partial = {
      code,
      severity:
        entry.level === 'Error' ? ('error' as const) : ('warn' as const),
      path: entry.file,
      line: entry.line,
      message: entry.message,
      subject: entry.rule_name,
    }
    return [
      {
        ...partial,
        fingerprint: fingerprintFinding(
          partial,
          statement ? normalizeSqlText(statement.text) : entry.message,
        ),
      },
    ]
  })
}
```

`src/adapters/squawk/runSquawk.ts`:

```ts
import { parseSquawkReport } from '@/adapters/squawk/parseSquawkReport.js'
import { SUPABASE_SQUAWK_EXCLUDES } from '@/adapters/squawk/SUPABASE_SQUAWK_EXCLUDES.js'
import type { Finding } from '@/model/Finding.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

export const runSquawk = (
  runner: CommandRunner,
  root: string,
  set: MigrationFile[],
  disabled: string[],
): Finding[] => {
  const result = runner(
    'squawk',
    [
      '--reporter',
      'json',
      '--exclude',
      SUPABASE_SQUAWK_EXCLUDES.join(','),
      ...set.map((file) => file.path),
    ],
    { cwd: root },
  )
  if (result.missing)
    throw new ToolMissingError('squawk', 'add squawk-cli as a devDependency')
  if (result.status !== 0 && result.status !== 1)
    throw new Error(`squawk exited ${result.status}: ${result.stderr.trim()}`)
  return parseSquawkReport(result.stdout, set, disabled)
}
```

- [ ] **Step 5: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/squawk && pnpm --filter @syntopica/db-quality lint`
Expected: PASS, integration test runs (squawk-cli is a devDependency of the
package).

```bash
git add packages/db-quality/src/adapters/squawk packages/db-quality/tests/adapters/squawk packages/db-quality/tests/fixtures/reports/squawk.json
git commit -m "feat(db-quality): squawk adapter with the Supabase exclusion profile"
```

---

### Task 8: Prisma adapter

**Files:**

- Create: `assets/prisma-lint.json`, `src/adapters/prisma/PrismaViolation.ts`,
  `src/adapters/prisma/parsePrismaLintReport.ts`,
  `src/adapters/prisma/runPrismaLint.ts`
- Test: `tests/adapters/prisma/parsePrismaLintReport.test.ts`,
  `tests/adapters/prisma/runPrismaLint.test.ts`,
  `tests/adapters/prisma/runPrismaLint.integration.test.ts`, fixture
  `tests/fixtures/prisma/schema.prisma`

**Interfaces:**

- Consumes: `CommandRunner`, `ToolMissingError`, `assetPath`,
  `fingerprintFinding`, `isDisabled`.
- Produces:
  - `type PrismaViolation = { ruleName: string; message: string; fileName: string; location: { startLine: number } }`
  - `parsePrismaLintReport(stderr: string, disabled: string[]): Finding[]` —
    parses `{"violations":[...]}`; code `BDB200/<ruleName>`, severity `warn`,
    path `fileName`, line `location.startLine`, subject = the field named in the
    message (`Field "x"` → `x`, else `''`), fingerprint context = message; empty
    stderr → no findings; non-JSON →
    `Error('prisma-lint produced no JSON report: ...')`
  - `runPrismaLint(runner, root, schemaPath, disabled): Finding[]` — runs
    `prisma-lint -c <assetPath('prisma-lint.json')> -o json <schemaPath>` in
    `root`; missing →
    `ToolMissingError('prisma-lint', 'add prisma-lint as a devDependency')`; the
    JSON is read from **stderr**; status other than 0 or 1 → `Error`

- [ ] **Step 1: Write the shipped config and the fixture**

`assets/prisma-lint.json`:

```json
{
  "rules": {
    "require-field-index": ["error", { "forAllRelations": true }]
  }
}
```

`tests/fixtures/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}
```

(`authorId` has no `@@index`, so the real tool reports one violation.)

- [ ] **Step 2: Write the failing tests**

`tests/adapters/prisma/parsePrismaLintReport.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { parsePrismaLintReport } from '@/adapters/prisma/parsePrismaLintReport.js'

const stderr =
  '{"violations":[{"ruleName":"require-field-index","message":"Field \\"updatedBy\\" must have an index.","fileName":"prisma/schema.prisma","location":{"startLine":730,"startColumn":3,"endLine":730,"endColumn":31}}]}'

describe('parsePrismaLintReport', () => {
  it('maps a violation to a BDB200 finding', () => {
    expect(parsePrismaLintReport(stderr, [])[0]).toMatchObject({
      code: 'BDB200/require-field-index',
      severity: 'warn',
      path: 'prisma/schema.prisma',
      line: 730,
      subject: 'updatedBy',
    })
  })
  it('drops disabled codes, accepts empty output, rejects garbage', () => {
    expect(
      parsePrismaLintReport(stderr, ['BDB200/require-field-index']),
    ).toEqual([])
    expect(parsePrismaLintReport('', [])).toEqual([])
    expect(() => parsePrismaLintReport('Error: boom', [])).toThrow(
      /no JSON report/,
    )
  })
})
```

`tests/adapters/prisma/runPrismaLint.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { runPrismaLint } from '@/adapters/prisma/runPrismaLint.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

describe('runPrismaLint', () => {
  it('runs prisma-lint with the shipped config and reads stderr', () => {
    const calls: string[][] = []
    const runner: CommandRunner = (command, args) => {
      calls.push([command, ...args])
      return {
        status: 1,
        stdout: '',
        stderr: '{"violations":[]}',
        missing: false,
      }
    }
    expect(runPrismaLint(runner, '/p', 'prisma/schema.prisma', [])).toEqual([])
    expect(calls[0]?.slice(0, 2)).toEqual(['prisma-lint', '-c'])
    expect(calls[0]?.[2]).toMatch(/assets\/prisma-lint\.json$/)
    expect(calls[0]?.slice(3)).toEqual(['-o', 'json', 'prisma/schema.prisma'])
  })
  it('raises ToolMissingError when absent', () => {
    expect(() =>
      runPrismaLint(
        () => ({ status: -1, stdout: '', stderr: '', missing: true }),
        '/p',
        'x',
        [],
      ),
    ).toThrow(ToolMissingError)
  })
})
```

`tests/adapters/prisma/runPrismaLint.integration.test.ts`:

```ts
import { cpSync, mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runPrismaLint } from '@/adapters/prisma/runPrismaLint.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('prisma-lint', ['--help'], {
  cwd: process.cwd(),
}).missing

describe.skipIf(!installed)('runPrismaLint with the real binary', () => {
  it('reports the relation field without an index', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'prisma'))
    cpSync(
      new URL('../../fixtures/prisma/schema.prisma', import.meta.url),
      join(root, 'prisma/schema.prisma'),
    )
    const findings = runPrismaLint(
      spawnRunner,
      root,
      'prisma/schema.prisma',
      [],
    )
    expect(findings.map((f) => [f.code, f.subject])).toEqual([
      ['BDB200/require-field-index', 'authorId'],
    ])
  })
})
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/prisma`
Expected: FAIL.

- [ ] **Step 4: Implement**

`src/adapters/prisma/PrismaViolation.ts`:

```ts
export type PrismaViolation = {
  ruleName: string
  message: string
  fileName: string
  location: { startLine: number }
}
```

`src/adapters/prisma/parsePrismaLintReport.ts`:

```ts
import type { PrismaViolation } from '@/adapters/prisma/PrismaViolation.js'
import { isDisabled } from '@/config/isDisabled.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'

export const parsePrismaLintReport = (
  stderr: string,
  disabled: string[],
): Finding[] => {
  if (!stderr.trim()) return []
  let violations: PrismaViolation[]
  try {
    violations = (JSON.parse(stderr) as { violations: PrismaViolation[] })
      .violations
  } catch {
    throw new Error(
      `prisma-lint produced no JSON report: ${stderr.slice(0, 200)}`,
    )
  }
  return violations.flatMap((violation) => {
    const code = `BDB200/${violation.ruleName}`
    if (isDisabled(code, disabled)) return []
    const partial = {
      code,
      severity: 'warn' as const,
      path: violation.fileName,
      line: violation.location.startLine,
      message: violation.message,
      subject: /Field "([^"]+)"/.exec(violation.message)?.[1] ?? '',
    }
    return [
      {
        ...partial,
        fingerprint: fingerprintFinding(partial, violation.message),
      },
    ]
  })
}
```

`src/adapters/prisma/runPrismaLint.ts`:

```ts
import { parsePrismaLintReport } from '@/adapters/prisma/parsePrismaLintReport.js'
import { assetPath } from '@/assetPath.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// prisma-lint writes its JSON report to stderr, and exits 1 whenever it has
// one violation to report. Both are its documented behaviour, not a bug here.
export const runPrismaLint = (
  runner: CommandRunner,
  root: string,
  schemaPath: string,
  disabled: string[],
): Finding[] => {
  const result = runner(
    'prisma-lint',
    ['-c', assetPath('prisma-lint.json'), '-o', 'json', schemaPath],
    { cwd: root },
  )
  if (result.missing)
    throw new ToolMissingError(
      'prisma-lint',
      'add prisma-lint as a devDependency',
    )
  if (result.status !== 0 && result.status !== 1)
    throw new Error(
      `prisma-lint exited ${result.status}: ${result.stderr.trim()}`,
    )
  return parsePrismaLintReport(result.stderr, disabled)
}
```

- [ ] **Step 5: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/prisma && pnpm --filter @syntopica/db-quality lint`
Expected: PASS including the integration test.

```bash
git add packages/db-quality/assets/prisma-lint.json packages/db-quality/src/adapters/prisma packages/db-quality/tests/adapters/prisma packages/db-quality/tests/fixtures/prisma
git commit -m "feat(db-quality): prisma-lint adapter requiring an index on every relation"
```

---

### Task 9: Drizzle adapter

**Files:**

- Create: `assets/drizzle-eslint.config.mjs`,
  `src/adapters/drizzle/EslintFileResult.ts`,
  `src/adapters/drizzle/parseEslintReport.ts`,
  `src/adapters/drizzle/runDrizzleLint.ts`
- Test: `tests/adapters/drizzle/parseEslintReport.test.ts`,
  `tests/adapters/drizzle/runDrizzleLint.test.ts`,
  `tests/adapters/drizzle/runDrizzleLint.integration.test.ts`

**Interfaces:**

- Consumes: `CommandRunner`, `ToolMissingError`, `assetPath`,
  `fingerprintFinding`, `isDisabled`.
- Produces:
  - `type EslintFileResult = { filePath: string; messages: { ruleId: string | null; message: string; line: number }[] }`
  - `parseEslintReport(stdout: string, root: string, disabled: string[]): Finding[]`
    — only messages whose `ruleId` starts with `drizzle/`; code
    `BDB300/<rule after the slash>`, severity `error`, path relative to `root`
    with POSIX separators, subject = rule name, fingerprint context = `message`;
    empty → none; non-JSON → `Error('eslint produced no JSON report: ...')`
  - `runDrizzleLint(runner, root, roots: string[], objectNames: string[], disabled): Finding[]`
    — runs
    `eslint --no-config-lookup -c <assetPath('drizzle-eslint.config.mjs')> -f json <roots...>`
    in `root` with env
    `CODEALITY_DB_DRIZZLE_OBJECTS=<objectNames joined by comma>`; missing →
    `ToolMissingError('eslint', 'add eslint, eslint-plugin-drizzle and typescript-eslint as devDependencies')`;
    status other than 0 or 1 → `Error` with stderr

- [ ] **Step 1: Write the shipped config**

`assets/drizzle-eslint.config.mjs`:

```js
// Run by codeality-db from the consumer's project directory with
// `--no-config-lookup`, so the project's own ESLint setup is neither read nor
// changed. The plugin and the parser resolve from wherever this file is
// installed, which is why both are peer dependencies of the package.
import drizzle from 'eslint-plugin-drizzle'
import tseslint from 'typescript-eslint'

const drizzleObjectName = (
  process.env.CODEALITY_DB_DRIZZLE_OBJECTS ?? 'db,tx'
).split(',')

export default [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.js', '**/*.mjs'],
    languageOptions: { parser: tseslint.parser },
    plugins: { drizzle },
    rules: {
      'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName }],
      'drizzle/enforce-update-with-where': ['error', { drizzleObjectName }],
    },
  },
]
```

- [ ] **Step 2: Write the failing tests**

`tests/adapters/drizzle/parseEslintReport.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { parseEslintReport } from '@/adapters/drizzle/parseEslintReport.js'

const stdout = JSON.stringify([
  {
    filePath: '/p/src/a.ts',
    messages: [
      {
        ruleId: 'drizzle/enforce-delete-with-where',
        message:
          'Without `.where(...)` you will delete all the rows in a table.',
        line: 7,
      },
      { ruleId: 'no-unused-vars', message: 'x', line: 1 },
      { ruleId: null, message: 'Parsing error', line: 1 },
    ],
  },
  { filePath: '/p/src/b.ts', messages: [] },
])

describe('parseEslintReport', () => {
  it('keeps only drizzle rules, with root-relative paths', () => {
    const findings = parseEslintReport(stdout, '/p', [])
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      code: 'BDB300/enforce-delete-with-where',
      severity: 'error',
      path: 'src/a.ts',
      line: 7,
      subject: 'enforce-delete-with-where',
    })
  })
  it('drops disabled codes and rejects non-JSON', () => {
    expect(
      parseEslintReport(stdout, '/p', ['BDB300/enforce-delete-with-where']),
    ).toEqual([])
    expect(() => parseEslintReport('Oops!', '/p', [])).toThrow(/no JSON report/)
  })
})
```

`tests/adapters/drizzle/runDrizzleLint.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { runDrizzleLint } from '@/adapters/drizzle/runDrizzleLint.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

describe('runDrizzleLint', () => {
  it('runs eslint with the shipped config, the roots and the object names', () => {
    let seen: { args: string[]; env?: Record<string, string> } | undefined
    const runner: CommandRunner = (_command, args, options) => {
      seen = { args, env: options.env }
      return { status: 0, stdout: '[]', stderr: '', missing: false }
    }
    expect(
      runDrizzleLint(runner, '/p', ['src', 'server'], ['db', 'trx'], []),
    ).toEqual([])
    expect(seen?.args.slice(0, 2)).toEqual(['--no-config-lookup', '-c'])
    expect(seen?.args[2]).toMatch(/assets\/drizzle-eslint\.config\.mjs$/)
    expect(seen?.args.slice(3)).toEqual(['-f', 'json', 'src', 'server'])
    expect(seen?.env).toEqual({ CODEALITY_DB_DRIZZLE_OBJECTS: 'db,trx' })
  })
})
```

`tests/adapters/drizzle/runDrizzleLint.integration.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runDrizzleLint } from '@/adapters/drizzle/runDrizzleLint.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('eslint', ['--version'], { cwd: process.cwd() })
  .missing

describe.skipIf(!installed)('runDrizzleLint with the real eslint', () => {
  it('flags delete and update without where, and accepts a guarded delete', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'src'))
    writeFileSync(
      join(root, 'src/repo.ts'),
      'declare const db: any\ndb.delete(1)\ndb.update(1).set({})\ndb.delete(1).where(true)\n',
    )
    // The package's own node_modules hold the peers; eslint resolves the
    // config's imports from the asset location, not from the temp root.
    const findings = runDrizzleLint(
      spawnRunner,
      root,
      ['src'],
      ['db', 'tx'],
      [],
    )
    expect(findings.map((f) => [f.code, f.line])).toEqual([
      ['BDB300/enforce-delete-with-where', 2],
      ['BDB300/enforce-update-with-where', 3],
    ])
  })
})
```

- [ ] **Step 3: Run the tests to see them fail**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/drizzle`
Expected: FAIL.

- [ ] **Step 4: Implement**

`src/adapters/drizzle/EslintFileResult.ts`:

```ts
export type EslintFileResult = {
  filePath: string
  messages: { ruleId: string | null; message: string; line: number }[]
}
```

`src/adapters/drizzle/parseEslintReport.ts`:

```ts
import { relative } from 'node:path'

import type { EslintFileResult } from '@/adapters/drizzle/EslintFileResult.js'
import { isDisabled } from '@/config/isDisabled.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'

export const parseEslintReport = (
  stdout: string,
  root: string,
  disabled: string[],
): Finding[] => {
  if (!stdout.trim()) return []
  let files: EslintFileResult[]
  try {
    files = JSON.parse(stdout) as EslintFileResult[]
  } catch {
    throw new Error(`eslint produced no JSON report: ${stdout.slice(0, 200)}`)
  }
  return files.flatMap((file) =>
    file.messages.flatMap((message) => {
      if (!message.ruleId?.startsWith('drizzle/')) return []
      const rule = message.ruleId.slice('drizzle/'.length)
      const code = `BDB300/${rule}`
      if (isDisabled(code, disabled)) return []
      const partial = {
        code,
        severity: 'error' as const,
        path: relative(root, file.filePath).replaceAll('\\', '/'),
        line: message.line,
        message: message.message,
        subject: rule,
      }
      return [
        {
          ...partial,
          fingerprint: fingerprintFinding(partial, message.message),
        },
      ]
    }),
  )
}
```

`src/adapters/drizzle/runDrizzleLint.ts`:

```ts
import { parseEslintReport } from '@/adapters/drizzle/parseEslintReport.js'
import { assetPath } from '@/assetPath.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// Runs from the project root: ESLint ignores any file outside its cwd, which
// is what an earlier attempt from another directory reported as "all files
// matching the pattern are ignored".
export const runDrizzleLint = (
  runner: CommandRunner,
  root: string,
  roots: string[],
  objectNames: string[],
  disabled: string[],
): Finding[] => {
  const result = runner(
    'eslint',
    [
      '--no-config-lookup',
      '-c',
      assetPath('drizzle-eslint.config.mjs'),
      '-f',
      'json',
      ...roots,
    ],
    { cwd: root, env: { CODEALITY_DB_DRIZZLE_OBJECTS: objectNames.join(',') } },
  )
  if (result.missing)
    throw new ToolMissingError(
      'eslint',
      'add eslint, eslint-plugin-drizzle and typescript-eslint as devDependencies',
    )
  if (result.status !== 0 && result.status !== 1)
    throw new Error(`eslint exited ${result.status}: ${result.stderr.trim()}`)
  return parseEslintReport(result.stdout, root, disabled)
}
```

- [ ] **Step 5: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/drizzle && pnpm --filter @syntopica/db-quality lint`
Expected: PASS. If the integration test reports "Definition for rule ... was not
found" errors for the temp file, that is fine: only `drizzle/` rules are mapped.

```bash
git add packages/db-quality/assets/drizzle-eslint.config.mjs packages/db-quality/src/adapters/drizzle packages/db-quality/tests/adapters/drizzle
git commit -m "feat(db-quality): drizzle adapter for unguarded delete and update"
```

---

### Task 10: SQLite adapter

**Files:**

- Create: `src/adapters/sqlite/sqliteQuery.ts`,
  `src/adapters/sqlite/hasPrimaryKey.ts`,
  `src/adapters/sqlite/runSqliteChecks.ts`
- Test: `tests/adapters/sqlite/hasPrimaryKey.test.ts`,
  `tests/adapters/sqlite/runSqliteChecks.test.ts`,
  `tests/adapters/sqlite/runSqliteChecks.integration.test.ts`

**Interfaces:**

- Consumes: `CommandRunner`, `ToolMissingError`, `fingerprintFinding`,
  `isDisabled`.
- Produces:
  - `sqliteQuery(runner, root, file, sql): string` — runs
    `sqlite3 -json -readonly <file> "<sql>"` in `root`, returns stdout; missing
    → `ToolMissingError('sqlite3', 'install the sqlite3 command line shell')`;
    non-zero status → `Error('sqlite3 failed on <file>: <stderr>')`
  - `hasPrimaryKey(createSql: string): boolean` — `true` when the `CREATE TABLE`
    text contains `primary key` (case-insensitive) or starts with
    `create virtual table`
  - `runSqliteChecks(runner, root, files: string[], disabled: string[]): Finding[]`:
    - `BDB401 integrity-check` (error): `PRAGMA integrity_check` returns
      anything but one row `ok`; message is the first row; line 0
    - `BDB402 foreign-key-check` (error): one finding per row of
      `PRAGMA foreign_key_check`, subject `<table>` and message
      `row <rowid> references missing <parent>`
    - `BDB403 table-without-primary-key` (warn): every row of
      `select name, sql from sqlite_master where type = 'table' and name not like 'sqlite_%'`
      whose `sql` fails `hasPrimaryKey`, subject the table name
    - path = the sqlite file, line 0, fingerprint context = subject (or message
      for 401)

- [ ] **Step 1: Write the failing tests**

`tests/adapters/sqlite/hasPrimaryKey.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { hasPrimaryKey } from '@/adapters/sqlite/hasPrimaryKey.js'

describe('hasPrimaryKey', () => {
  it.each([
    ['CREATE TABLE a (id INTEGER PRIMARY KEY)', true],
    ['create table b (x int, y int, primary key (x, y))', true],
    ['CREATE VIRTUAL TABLE fts USING fts5(body)', true],
    ['CREATE TABLE c (x int)', false],
  ])('%s -> %s', (sql, expected) => {
    expect(hasPrimaryKey(sql)).toBe(expected)
  })
})
```

`tests/adapters/sqlite/runSqliteChecks.test.ts` (runner stub answering by SQL
text):

```ts
import { describe, expect, it } from 'vitest'

import { runSqliteChecks } from '@/adapters/sqlite/runSqliteChecks.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const answers: Record<string, string> = {
  'PRAGMA integrity_check': '[{"integrity_check":"ok"}]',
  'PRAGMA foreign_key_check':
    '[{"table":"posts","rowid":3,"parent":"users","fkid":0}]',
  "select name, sql from sqlite_master where type = 'table' and name not like 'sqlite_%'":
    '[{"name":"users","sql":"CREATE TABLE users (id INTEGER PRIMARY KEY)"},{"name":"log","sql":"CREATE TABLE log (line TEXT)"}]',
}
const runner: CommandRunner = (_command, args) => ({
  status: 0,
  stdout: answers[args[args.length - 1] ?? ''] ?? '',
  stderr: '',
  missing: false,
})

describe('runSqliteChecks', () => {
  it('reports the dangling foreign key and the table without a primary key', () => {
    expect(
      runSqliteChecks(runner, '/p', ['data/app.db'], []).map((f) => [
        f.code,
        f.subject,
      ]),
    ).toEqual([
      ['BDB402', 'posts'],
      ['BDB403', 'log'],
    ])
  })
  it('reports a failed integrity check as an error', () => {
    const broken: CommandRunner = (_c, args) => ({
      status: 0,
      stdout:
        args.at(-1) === 'PRAGMA integrity_check'
          ? '[{"integrity_check":"*** in database main *** Page 3: btreeInitPage() returns error code 11"}]'
          : '[]',
      stderr: '',
      missing: false,
    })
    expect(runSqliteChecks(broken, '/p', ['a.db'], [])[0]).toMatchObject({
      code: 'BDB401',
      severity: 'error',
      path: 'a.db',
    })
  })
})
```

`tests/adapters/sqlite/runSqliteChecks.integration.test.ts`:

```ts
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runSqliteChecks } from '@/adapters/sqlite/runSqliteChecks.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const installed = !spawnRunner('sqlite3', ['--version'], { cwd: process.cwd() })
  .missing

describe.skipIf(!installed)('runSqliteChecks with the real sqlite3', () => {
  it('finds the table without a primary key in a fresh database', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    execFileSync('sqlite3', [
      join(root, 'a.db'),
      'create table ok (id integer primary key); create table bare (x text);',
    ])
    expect(
      runSqliteChecks(spawnRunner, root, ['a.db'], []).map((f) => [
        f.code,
        f.subject,
      ]),
    ).toEqual([['BDB403', 'bare']])
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/sqlite`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/adapters/sqlite/sqliteQuery.ts`:

```ts
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

export const sqliteQuery = (
  runner: CommandRunner,
  root: string,
  file: string,
  sql: string,
): string => {
  const result = runner('sqlite3', ['-json', '-readonly', file, sql], {
    cwd: root,
  })
  if (result.missing)
    throw new ToolMissingError(
      'sqlite3',
      'install the sqlite3 command line shell',
    )
  if (result.status !== 0)
    throw new Error(`sqlite3 failed on ${file}: ${result.stderr.trim()}`)
  return result.stdout
}
```

`src/adapters/sqlite/hasPrimaryKey.ts`:

```ts
export const hasPrimaryKey = (createSql: string): boolean => {
  const text = createSql.toLowerCase()
  return text.startsWith('create virtual table') || text.includes('primary key')
}
```

`src/adapters/sqlite/runSqliteChecks.ts`:

```ts
import { hasPrimaryKey } from '@/adapters/sqlite/hasPrimaryKey.js'
import { sqliteQuery } from '@/adapters/sqlite/sqliteQuery.js'
import { isDisabled } from '@/config/isDisabled.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'
import type { Severity } from '@/model/Severity.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const runSqliteChecks = (
  runner: CommandRunner,
  root: string,
  files: string[],
  disabled: string[],
): Finding[] =>
  files.flatMap((file) => {
    const rows = <T>(sql: string): T[] => {
      const out = sqliteQuery(runner, root, file, sql).trim()
      return out ? (JSON.parse(out) as T[]) : []
    }
    const make = (
      code: string,
      severity: Severity,
      subject: string,
      message: string,
      context: string,
    ): Finding[] => {
      if (isDisabled(code, disabled)) return []
      const partial = { code, severity, path: file, line: 0, message, subject }
      return [{ ...partial, fingerprint: fingerprintFinding(partial, context) }]
    }
    const integrity = rows<{ integrity_check: string }>(
      'PRAGMA integrity_check',
    )
    const first = integrity[0]?.integrity_check ?? 'no result'
    const broken =
      integrity.length !== 1 || first !== 'ok'
        ? make('BDB401', 'error', '', `integrity_check: ${first}`, first)
        : []
    const foreign = rows<{ table: string; rowid: number; parent: string }>(
      'PRAGMA foreign_key_check',
    ).flatMap((row) =>
      make(
        'BDB402',
        'error',
        row.table,
        `row ${row.rowid} references missing ${row.parent}`,
        `${row.table}:${row.rowid}:${row.parent}`,
      ),
    )
    const tables = rows<{ name: string; sql: string }>(
      "select name, sql from sqlite_master where type = 'table' and name not like 'sqlite_%'",
    ).flatMap((row) =>
      hasPrimaryKey(row.sql)
        ? []
        : make(
            'BDB403',
            'warn',
            row.name,
            'table has no primary key',
            row.name,
          ),
    )
    return [...broken, ...foreign, ...tables]
  })
```

- [ ] **Step 4: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/sqlite && pnpm --filter @syntopica/db-quality lint`
Expected: PASS.

```bash
git add packages/db-quality/src/adapters/sqlite packages/db-quality/tests/adapters/sqlite
git commit -m "feat(db-quality): sqlite integrity, foreign key and primary key checks"
```

---

### Task 11: `check` command

**Files:**

- Create: `src/check/CheckContext.ts`, `src/check/runCheck.ts`,
  `src/check/renderFindings.ts`, `src/check/renderFindingsJson.ts`,
  `src/commands/parseCommandArgs.ts`, `src/commands/checkCommand.ts`
- Test: `tests/check/runCheck.test.ts`, `tests/check/renderFindings.test.ts`,
  `tests/commands/parseCommandArgs.test.ts`,
  `tests/commands/checkCommand.test.ts`

**Interfaces:**

- Consumes: `readConfig`, `readMigrationSet`, `runSqlRules`, `runSquawk`,
  `runPrismaLint`, `runDrizzleLint`, `runSqliteChecks`, `compareFindings`,
  `ExitCode`, `ConfigError`, `ToolMissingError`.
- Produces:
  - `type CheckContext = { root: string; config: DbQualityConfig; runner: CommandRunner }`
  - `runCheck(context: CheckContext): Finding[]` — for each configured section,
    runs its adapters (supabase: `runSqlRules` then `runSquawk`; prisma;
    drizzle; sqlite), concatenates and sorts. It does not catch errors.
  - `renderFindings(findings: Finding[]): string` — one line each:
    `<path>:<line>: <code> <message>` + ` (<subject>)` when subject is
    non-empty, then a final line `<n> findings`
  - `renderFindingsJson(findings: Finding[]): string` —
    `{"schemaVersion":1,"findings":[...]}` pretty-printed
  - `parseCommandArgs(argv: string[], options: Record<string, { type: 'boolean' | 'string' }>): { values: Record<string, string | boolean | undefined>; positionals: string[] }`
    — `node:util` `parseArgs` with `allowPositionals`, `strict`, rethrowing its
    error as `ConfigError`
  - `checkCommand(argv: string[], io: { root: string; runner: CommandRunner; stdout: (s: string) => void; stderr: (s: string) => void }): number`
    — options `--json`; returns the exit code: 0 no findings, 1 findings, 2
    `ConfigError` (message on stderr), 3 `ToolMissingError` or any other `Error`
    (message on stderr)

- [ ] **Step 1: Write the failing tests**

`tests/check/runCheck.test.ts` (every adapter is reached through the runner, so
a stub runner that answers each tool proves the wiring):

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runCheck } from '@/check/runCheck.js'
import { validateConfigDocument } from '@/config/validateConfigDocument.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const runner: CommandRunner = (command) => {
  if (command === 'squawk')
    return { status: 0, stdout: '[]', stderr: '', missing: false }
  if (command === 'prisma-lint')
    return {
      status: 1,
      stdout: '',
      stderr:
        '{"violations":[{"ruleName":"require-field-index","message":"Field \\"a\\" must have an index.","fileName":"prisma/schema.prisma","location":{"startLine":2}}]}',
      missing: false,
    }
  if (command === 'eslint')
    return { status: 0, stdout: '[]', stderr: '', missing: false }
  return { status: 0, stdout: '[]', stderr: '', missing: false }
}

describe('runCheck', () => {
  it('runs every configured adapter and returns the sorted findings', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    writeFileSync(
      join(root, 'supabase/migrations/1.sql'),
      'create table public.t (id int);',
    )
    const config = validateConfigDocument({
      schemaVersion: 1,
      supabase: { migrations: 'supabase/migrations' },
      prisma: { schema: 'prisma/schema.prisma' },
      drizzle: { roots: ['src'] },
      sqlite: { files: ['a.db'] },
    })
    expect(runCheck({ root, config, runner }).map((f) => f.code)).toEqual([
      'BDB200/require-field-index',
      'BDB003',
    ])
  })
  it('does nothing with an empty configuration', () => {
    expect(
      runCheck({
        root: '/nowhere',
        config: validateConfigDocument({ schemaVersion: 1 }),
        runner,
      }),
    ).toEqual([])
  })
})
```

`tests/check/renderFindings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { renderFindings } from '@/check/renderFindings.js'
import { renderFindingsJson } from '@/check/renderFindingsJson.js'

const finding = {
  code: 'BDB001',
  severity: 'warn' as const,
  path: 'm/a.sql',
  line: 3,
  message: 'policy is permissive',
  subject: 'public.t',
  fingerprint: 'abcd',
}

describe('renderFindings', () => {
  it('prints one line per finding and a count', () => {
    expect(renderFindings([finding])).toBe(
      'm/a.sql:3: BDB001 policy is permissive (public.t)\n1 findings',
    )
    expect(renderFindings([])).toBe('0 findings')
  })
  it('renders the JSON document', () => {
    expect(JSON.parse(renderFindingsJson([finding]))).toEqual({
      schemaVersion: 1,
      findings: [finding],
    })
  })
})
```

`tests/commands/parseCommandArgs.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { ConfigError } from '@/config/ConfigError.js'

describe('parseCommandArgs', () => {
  it('parses flags and positionals', () => {
    expect(
      parseCommandArgs(['--json', 'create'], { json: { type: 'boolean' } }),
    ).toEqual({ values: { json: true }, positionals: ['create'] })
  })
  it('turns an unknown flag into a ConfigError', () => {
    expect(() => parseCommandArgs(['--nope'], {})).toThrow(ConfigError)
  })
})
```

`tests/commands/checkCommand.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { checkCommand } from '@/commands/checkCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const io = (root: string, runner: CommandRunner) => {
  const out: string[] = []
  const err: string[] = []
  return {
    root,
    runner,
    stdout: (s: string) => out.push(s),
    stderr: (s: string) => err.push(s),
    out,
    err,
  }
}
const ok: CommandRunner = () => ({
  status: 0,
  stdout: '[]',
  stderr: '',
  missing: false,
})

describe('checkCommand', () => {
  it('exits 2 without a configuration file', () => {
    const context = io(mkdtempSync(join(tmpdir(), 'dbq-')), ok)
    expect(checkCommand([], context)).toBe(2)
    expect(context.err.join('')).toMatch(/codeality-db.json not found/)
  })
  it('exits 1 with findings and prints them', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    writeFileSync(
      join(root, 'supabase/migrations/1.sql'),
      'create table public.t (id int);',
    )
    writeFileSync(
      join(root, 'codeality-db.json'),
      '{"schemaVersion":1,"supabase":{"migrations":"supabase/migrations"}}',
    )
    const context = io(root, ok)
    expect(checkCommand([], context)).toBe(1)
    expect(context.out.join('')).toMatch(/BDB003/)
  })
  it('exits 3 when a required tool is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    writeFileSync(
      join(root, 'codeality-db.json'),
      '{"schemaVersion":1,"supabase":{"migrations":"supabase/migrations"}}',
    )
    const context = io(root, () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    }))
    expect(checkCommand([], context)).toBe(3)
    expect(context.err.join('')).toMatch(/squawk is not installed/)
  })
  it('exits 0 and prints JSON when clean', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    const context = io(root, ok)
    expect(checkCommand(['--json'], context)).toBe(0)
    expect(JSON.parse(context.out.join(''))).toEqual({
      schemaVersion: 1,
      findings: [],
    })
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/check tests/commands`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/check/CheckContext.ts`:

```ts
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export type CheckContext = {
  root: string
  config: DbQualityConfig
  runner: CommandRunner
}
```

`src/check/runCheck.ts`:

```ts
import { runDrizzleLint } from '@/adapters/drizzle/runDrizzleLint.js'
import { runPrismaLint } from '@/adapters/prisma/runPrismaLint.js'
import { runSqliteChecks } from '@/adapters/sqlite/runSqliteChecks.js'
import { runSquawk } from '@/adapters/squawk/runSquawk.js'
import type { CheckContext } from '@/check/CheckContext.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'
import { runSqlRules } from '@/rules/runSqlRules.js'
import { readMigrationSet } from '@/sql/readMigrationSet.js'

export const runCheck = ({ root, config, runner }: CheckContext): Finding[] => {
  const findings: Finding[] = []
  if (config.supabase) {
    const set = readMigrationSet(root, config.supabase.migrations)
    findings.push(
      ...runSqlRules(set, config.disable),
      ...runSquawk(runner, root, set, config.disable),
    )
  }
  if (config.prisma)
    findings.push(
      ...runPrismaLint(runner, root, config.prisma.schema, config.disable),
    )
  if (config.drizzle)
    findings.push(
      ...runDrizzleLint(
        runner,
        root,
        config.drizzle.roots,
        config.drizzle.objectNames,
        config.disable,
      ),
    )
  if (config.sqlite)
    findings.push(
      ...runSqliteChecks(runner, root, config.sqlite.files, config.disable),
    )
  return findings.sort(compareFindings)
}
```

`src/check/renderFindings.ts`:

```ts
import type { Finding } from '@/model/Finding.js'

export const renderFindings = (findings: Finding[]): string =>
  [
    ...findings.map(
      (f) =>
        `${f.path}:${f.line}: ${f.code} ${f.message}${f.subject ? ` (${f.subject})` : ''}`,
    ),
    `${findings.length} findings`,
  ].join('\n')
```

`src/check/renderFindingsJson.ts`:

```ts
import type { Finding } from '@/model/Finding.js'

export const renderFindingsJson = (findings: Finding[]): string =>
  JSON.stringify({ schemaVersion: 1, findings }, null, 2)
```

`src/commands/parseCommandArgs.ts`:

```ts
import { parseArgs } from 'node:util'

import { ConfigError } from '@/config/ConfigError.js'

export const parseCommandArgs = (
  argv: string[],
  options: Record<string, { type: 'boolean' | 'string' }>,
): {
  values: Record<string, string | boolean | undefined>
  positionals: string[]
} => {
  try {
    const parsed = parseArgs({
      args: argv,
      options,
      allowPositionals: true,
      strict: true,
    })
    return { values: parsed.values, positionals: parsed.positionals }
  } catch (error) {
    throw new ConfigError((error as Error).message)
  }
}
```

`src/commands/checkCommand.ts`:

```ts
import { renderFindings } from '@/check/renderFindings.js'
import { renderFindingsJson } from '@/check/renderFindingsJson.js'
import { runCheck } from '@/check/runCheck.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { ConfigError } from '@/config/ConfigError.js'
import { readConfig } from '@/config/readConfig.js'
import { ExitCode } from '@/model/ExitCode.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const checkCommand = (
  argv: string[],
  io: {
    root: string
    runner: CommandRunner
    stdout: (s: string) => void
    stderr: (s: string) => void
  },
): number => {
  try {
    const { values } = parseCommandArgs(argv, { json: { type: 'boolean' } })
    const findings = runCheck({
      root: io.root,
      config: readConfig(io.root),
      runner: io.runner,
    })
    io.stdout(
      `${values['json'] === true ? renderFindingsJson(findings) : renderFindings(findings)}\n`,
    )
    return findings.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
  } catch (error) {
    io.stderr(
      `${error instanceof ConfigError ? 'configuration error' : 'error'}: ${(error as Error).message}\n`,
    )
    return error instanceof ConfigError
      ? ExitCode.CONFIGURATION
      : ExitCode.INFRASTRUCTURE
  }
}
```

- [ ] **Step 4: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/check tests/commands && pnpm --filter @syntopica/db-quality lint`
Expected: PASS.

```bash
git add packages/db-quality/src/check packages/db-quality/src/commands packages/db-quality/tests/check packages/db-quality/tests/commands
git commit -m "feat(db-quality): check command composing the static adapters"
```

---

### Task 12: Baseline

**Files:**

- Create: `src/baseline/BASELINE_FILENAME.ts`, `src/baseline/BaselineFile.ts`,
  `src/baseline/readBaseline.ts`, `src/baseline/writeBaseline.ts`,
  `src/baseline/ClassifiedFindings.ts`, `src/baseline/classifyFindings.ts`,
  `src/commands/baselineCommand.ts`
- Test: `tests/baseline/classifyFindings.test.ts`,
  `tests/baseline/readWriteBaseline.test.ts`,
  `tests/commands/baselineCommand.test.ts`

**Interfaces:**

- Consumes: `Finding`, `runCheck`, `readConfig`, `ExitCode`, `ConfigError`,
  `PACKAGE_VERSION`, `parseCommandArgs`.
- Produces:
  - `BASELINE_FILENAME = '.codeality-db-baseline.json'`
  - `type BaselineFile = { schemaVersion: 1; toolVersion: string; entries: string[] }`
    (sorted fingerprints)
  - `readBaseline(root): BaselineFile` — `ConfigError` when missing or invalid
  - `writeBaseline(root, baseline): void` — atomic (write `.tmp`, rename),
    sorted entries, trailing newline
  - `type ClassifiedFindings = { new: Finding[]; known: Finding[]; resolved: string[] }`
  - `classifyFindings(findings, baseline): ClassifiedFindings` — `resolved` are
    baseline entries no finding carries, sorted
  - `baselineCommand(argv, io): number` — subcommands `create` (write from the
    current findings; refuses with exit 2 when the file exists), `update`
    (rewrite), `check [--check-stale]` (print
    `<n> new, <k> known, <r> resolved`, then each new finding as
    `renderFindings` does; exit 1 on new findings, or on resolved ones with
    `--check-stale`); no subcommand → exit 2 with usage

- [ ] **Step 1: Write the failing tests**

`tests/baseline/classifyFindings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { classifyFindings } from '@/baseline/classifyFindings.js'

const finding = (fingerprint: string) => ({
  code: 'BDB001',
  severity: 'warn' as const,
  path: 'a',
  line: 1,
  message: '',
  subject: '',
  fingerprint,
})

describe('classifyFindings', () => {
  it('splits findings into new, known and resolved', () => {
    const result = classifyFindings([finding('aaa'), finding('bbb')], {
      schemaVersion: 1,
      toolVersion: '0',
      entries: ['bbb', 'ccc'],
    })
    expect(result.new.map((f) => f.fingerprint)).toEqual(['aaa'])
    expect(result.known.map((f) => f.fingerprint)).toEqual(['bbb'])
    expect(result.resolved).toEqual(['ccc'])
  })
})
```

`tests/baseline/readWriteBaseline.test.ts`:

```ts
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readBaseline } from '@/baseline/readBaseline.js'
import { writeBaseline } from '@/baseline/writeBaseline.js'
import { ConfigError } from '@/config/ConfigError.js'

describe('baseline file', () => {
  it('round-trips with sorted entries and a trailing newline', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeBaseline(root, {
      schemaVersion: 1,
      toolVersion: '0.1.0',
      entries: ['b', 'a'],
    })
    expect(
      readFileSync(join(root, '.codeality-db-baseline.json'), 'utf8'),
    ).toBe(
      '{\n  "schemaVersion": 1,\n  "toolVersion": "0.1.0",\n  "entries": [\n    "a",\n    "b"\n  ]\n}\n',
    )
    expect(readBaseline(root).entries).toEqual(['a', 'b'])
  })
  it('reports a missing baseline', () => {
    expect(() => readBaseline(mkdtempSync(join(tmpdir(), 'dbq-')))).toThrow(
      ConfigError,
    )
  })
})
```

`tests/commands/baselineCommand.test.ts`:

```ts
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { baselineCommand } from '@/commands/baselineCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const ok: CommandRunner = () => ({
  status: 0,
  stdout: '[]',
  stderr: '',
  missing: false,
})
const project = (sql: string) => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-'))
  mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
  writeFileSync(join(root, 'supabase/migrations/1.sql'), sql)
  writeFileSync(
    join(root, 'codeality-db.json'),
    '{"schemaVersion":1,"supabase":{"migrations":"supabase/migrations"}}',
  )
  const out: string[] = []
  return {
    root,
    runner: ok,
    stdout: (s: string) => out.push(s),
    stderr: (s: string) => out.push(s),
    out,
  }
}

describe('baselineCommand', () => {
  it('create records the debt, check then passes, a new finding fails', () => {
    const io = project('create table public.t (id int);')
    expect(baselineCommand(['create'], io)).toBe(0)
    expect(existsSync(join(io.root, '.codeality-db-baseline.json'))).toBe(true)
    expect(baselineCommand(['check'], io)).toBe(0)
    writeFileSync(
      join(io.root, 'supabase/migrations/2.sql'),
      'create table public.u (id int);',
    )
    expect(baselineCommand(['check'], io)).toBe(1)
    expect(io.out.join('')).toMatch(/1 new, 1 known, 0 resolved/)
  })
  it('create refuses to overwrite, update does not', () => {
    const io = project('select 1;')
    expect(baselineCommand(['create'], io)).toBe(0)
    expect(baselineCommand(['create'], io)).toBe(2)
    expect(baselineCommand(['update'], io)).toBe(0)
  })
  it('check --check-stale fails on resolved debt', () => {
    const io = project('create table public.t (id int);')
    baselineCommand(['create'], io)
    writeFileSync(join(io.root, 'supabase/migrations/1.sql'), 'select 1;')
    expect(baselineCommand(['check'], io)).toBe(0)
    expect(baselineCommand(['check', '--check-stale'], io)).toBe(1)
  })
  it('needs a subcommand', () => {
    expect(baselineCommand([], project('select 1;'))).toBe(2)
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/baseline tests/commands/baselineCommand.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/baseline/BASELINE_FILENAME.ts`:

```ts
export const BASELINE_FILENAME = '.codeality-db-baseline.json'
```

`src/baseline/BaselineFile.ts`:

```ts
/** The fingerprints a project has agreed to carry. */
export type BaselineFile = {
  schemaVersion: 1
  toolVersion: string
  entries: string[]
}
```

`src/baseline/readBaseline.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import type { BaselineFile } from '@/baseline/BaselineFile.js'
import { ConfigError } from '@/config/ConfigError.js'

export const readBaseline = (root: string): BaselineFile => {
  const path = join(root, BASELINE_FILENAME)
  if (!existsSync(path))
    throw new ConfigError(
      `${BASELINE_FILENAME} not found; run "codeality-db baseline create"`,
    )
  const document = JSON.parse(
    readFileSync(path, 'utf8'),
  ) as Partial<BaselineFile>
  if (document.schemaVersion !== 1 || !Array.isArray(document.entries))
    throw new ConfigError(`${BASELINE_FILENAME} is not a version 1 baseline`)
  return {
    schemaVersion: 1,
    toolVersion: document.toolVersion ?? '',
    entries: [...document.entries].sort(),
  }
}
```

`src/baseline/writeBaseline.ts`:

```ts
import { renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import type { BaselineFile } from '@/baseline/BaselineFile.js'

export const writeBaseline = (root: string, baseline: BaselineFile): void => {
  const path = join(root, BASELINE_FILENAME)
  const document = {
    schemaVersion: 1,
    toolVersion: baseline.toolVersion,
    entries: [...baseline.entries].sort(),
  }
  writeFileSync(`${path}.tmp`, `${JSON.stringify(document, null, 2)}\n`)
  renameSync(`${path}.tmp`, path)
}
```

`src/baseline/ClassifiedFindings.ts`:

```ts
import type { Finding } from '@/model/Finding.js'

export type ClassifiedFindings = {
  new: Finding[]
  known: Finding[]
  resolved: string[]
}
```

`src/baseline/classifyFindings.ts`:

```ts
import type { BaselineFile } from '@/baseline/BaselineFile.js'
import type { ClassifiedFindings } from '@/baseline/ClassifiedFindings.js'
import type { Finding } from '@/model/Finding.js'

// A baseline entry nothing reports any more is resolved, and reporting it is
// what stops dead debt being carried forever.
export const classifyFindings = (
  findings: Finding[],
  baseline: BaselineFile,
): ClassifiedFindings => {
  const entries = new Set(baseline.entries)
  const current = new Set(findings.map((finding) => finding.fingerprint))
  return {
    new: findings.filter((finding) => !entries.has(finding.fingerprint)),
    known: findings.filter((finding) => entries.has(finding.fingerprint)),
    resolved: baseline.entries.filter((entry) => !current.has(entry)).sort(),
  }
}
```

`src/commands/baselineCommand.ts`:

```ts
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import { classifyFindings } from '@/baseline/classifyFindings.js'
import { readBaseline } from '@/baseline/readBaseline.js'
import { writeBaseline } from '@/baseline/writeBaseline.js'
import { renderFindings } from '@/check/renderFindings.js'
import { runCheck } from '@/check/runCheck.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { ConfigError } from '@/config/ConfigError.js'
import { readConfig } from '@/config/readConfig.js'
import { ExitCode } from '@/model/ExitCode.js'
import { PACKAGE_VERSION } from '@/packageVersion.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const baselineCommand = (
  argv: string[],
  io: {
    root: string
    runner: CommandRunner
    stdout: (s: string) => void
    stderr: (s: string) => void
  },
): number => {
  try {
    const { values, positionals } = parseCommandArgs(argv, {
      'check-stale': { type: 'boolean' },
    })
    const action = positionals[0]
    if (action !== 'create' && action !== 'update' && action !== 'check')
      throw new ConfigError(
        'usage: codeality-db baseline create|update|check [--check-stale]',
      )
    const findings = runCheck({
      root: io.root,
      config: readConfig(io.root),
      runner: io.runner,
    })
    if (action === 'create' && existsSync(join(io.root, BASELINE_FILENAME)))
      throw new ConfigError(
        `${BASELINE_FILENAME} exists; use "baseline update" to rewrite it`,
      )
    if (action !== 'check') {
      writeBaseline(io.root, {
        schemaVersion: 1,
        toolVersion: PACKAGE_VERSION,
        entries: findings.map((f) => f.fingerprint),
      })
      io.stdout(
        `recorded ${findings.length} findings in ${BASELINE_FILENAME}\n`,
      )
      return ExitCode.OK
    }
    const classified = classifyFindings(findings, readBaseline(io.root))
    io.stdout(
      `${classified.new.length} new, ${classified.known.length} known, ${classified.resolved.length} resolved\n`,
    )
    if (classified.new.length > 0)
      io.stdout(`${renderFindings(classified.new)}\n`)
    const stale =
      values['check-stale'] === true && classified.resolved.length > 0
    return classified.new.length > 0 || stale ? ExitCode.FINDINGS : ExitCode.OK
  } catch (error) {
    io.stderr(
      `${error instanceof ConfigError ? 'configuration error' : 'error'}: ${(error as Error).message}\n`,
    )
    return error instanceof ConfigError
      ? ExitCode.CONFIGURATION
      : ExitCode.INFRASTRUCTURE
  }
}
```

- [ ] **Step 4: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/baseline tests/commands && pnpm --filter @syntopica/db-quality lint`
Expected: PASS.

```bash
git add packages/db-quality/src/baseline packages/db-quality/src/commands/baselineCommand.ts packages/db-quality/tests/baseline packages/db-quality/tests/commands/baselineCommand.test.ts
git commit -m "feat(db-quality): baseline of recorded debt with create, update and check"
```

---

### Task 13: Live adapters and the `audit` command

**Files:**

- Create: `src/adapters/supabase/AdvisorEntry.ts`,
  `src/adapters/supabase/parseAdvisorReport.ts`,
  `src/adapters/supabase/CliError.ts`, `src/adapters/supabase/parseCliError.ts`,
  `src/adapters/supabase/runAdvisors.ts`,
  `src/adapters/supabase/IndexStatRow.ts`, `src/adapters/supabase/BloatRow.ts`,
  `src/adapters/supabase/parseIndexStats.ts`,
  `src/adapters/supabase/parseBloat.ts`, `src/adapters/supabase/runInspect.ts`,
  `src/adapters/soda/dataSourceType.ts`,
  `src/adapters/soda/renderSodaConfiguration.ts`,
  `src/adapters/soda/SodaCheckResult.ts`,
  `src/adapters/soda/parseSodaResults.ts`, `src/adapters/soda/runSoda.ts`,
  `src/audit/AuditTarget.ts`, `src/audit/resolveAuditTarget.ts`,
  `src/audit/runAudit.ts`, `src/commands/auditCommand.ts`
- Test: `tests/adapters/supabase/parseAdvisorReport.test.ts`,
  `tests/adapters/supabase/parseCliError.test.ts`,
  `tests/adapters/supabase/runAdvisors.test.ts`,
  `tests/adapters/supabase/parseInspect.test.ts`,
  `tests/adapters/supabase/runInspect.test.ts`,
  `tests/adapters/soda/renderSodaConfiguration.test.ts`,
  `tests/adapters/soda/parseSodaResults.test.ts`,
  `tests/adapters/soda/runSoda.test.ts`,
  `tests/audit/resolveAuditTarget.test.ts`, `tests/audit/runAudit.test.ts`,
  `tests/commands/auditCommand.test.ts`, fixture
  `tests/fixtures/reports/advisors.json`

**Interfaces:**

- Consumes: `CommandRunner`, `ToolMissingError`, `fingerprintFinding`,
  `isDisabled`, `DbQualityConfig`, `readConfig`, `ExitCode`, `ConfigError`,
  `renderFindings`, `renderFindingsJson`, `parseCommandArgs`.
- Produces:
  - `type AdvisorEntry = { name: string; title: string; level: 'ERROR' | 'WARN' | 'INFO'; detail: string; metadata?: { name?: string; schema?: string; type?: string } }`
  - `parseAdvisorReport(stdout, disabled): Finding[]` — `{"results":[...]}`;
    code `BDB500/<name>`, severity `error`/`warn`/`info` from `level`, path
    `supabase`, line 0, message `detail` with backslash-escaped backticks
    unescaped, subject `<metadata.schema>.<metadata.name>` when both exist else
    `''`, fingerprint context = `detail`
  - `type CliError = { code: string; message: string }`
  - `parseCliError(text): CliError | undefined` — recognises
    `{"_tag":"Error","error":{...}}` anywhere in the text
  - `runAdvisors(runner, root, target: AuditTarget, disabled): Finding[]` —
    `supabase db advisors --type all --output-format json` plus `--linked` or
    `--db-url <url>`; missing →
    `ToolMissingError('supabase', 'install the Supabase CLI')`; a `CliError` or
    non-zero status → `Error('supabase advisors failed: <code>: <message>')`
  - `type IndexStatRow = { name: string; table: string; index_scans: string; unused: boolean }`,
    `type BloatRow = { type: string; name: string; bloat: string; waste: string }`
  - `parseIndexStats(stdout, disabled): Finding[]` — `BDB601 unused-index`
    (info) for rows with `unused === true` or `index_scans === '0'`, skipping
    names ending in `_pkey`; subject `name`, message
    `index has never been scanned (<size>)`, path `supabase`, context `name`
  - `parseBloat(stdout, threshold, disabled): Finding[]` — `BDB602 table-bloat`
    (warn) when `Number(bloat) > threshold`; subject `name`, message
    `bloat factor <bloat>, <waste> wasted`, context `name`
  - `runInspect(runner, root, target, threshold, disabled): Finding[]` — runs
    `supabase inspect db index-stats` and `supabase inspect db bloat`, each with
    `--output-format json` and the target flag; same error handling as advisors
  - `dataSourceType(url): 'postgres' | 'mysql'` — from the URL scheme
    (`postgres`, `postgresql` → `postgres`; `mysql` → `mysql`; anything else →
    `ConfigError`)
  - `renderSodaConfiguration(name, url): string` — YAML `data_source <name>:`
    block with `type`, `host`, `port`, `username`, `password`, `database` parsed
    from the URL (`schema: public` for postgres)
  - `type SodaCheckResult = { name: string; outcome: 'pass' | 'fail' | 'warn' | 'error'; table?: string; column?: string }`
  - `parseSodaResults(json, disabled): Finding[]` — one `BDB700/<name>` finding
    per `fail` (severity `error`) or `warn` (severity `warn`), path
    `<soda dir>/checks.yml`, subject `<table>` or `<table>.<column>`, context
    `name`
  - `runSoda(runner, root, sodaDir, url, disabled): Finding[]` — writes
    `configuration.yml` into a temp dir, runs
    `uvx --with setuptools --from soda-core-<type> soda scan -d codeality -c <temp>/configuration.yml -srf <temp>/results.json <sodaDir>/checks.yml`,
    env `SETUPTOOLS_USE_DISTUTILS=local`; missing →
    `ToolMissingError('uvx', 'install uv')`; status 3 or no results file →
    `Error`; deletes the temp dir
  - `type AuditTarget = { linked: true } | { dbUrl: string }`
  - `resolveAuditTarget(root, values: { linked?: boolean; 'db-url'?: string }): AuditTarget`
    — `--db-url` wins; `--linked` requires `supabase/.temp/project-ref` to
    exist, else `ConfigError`; neither →
    `ConfigError('audit needs --linked or --db-url')`
  - `runAudit(context: { root; config; runner; target }): Finding[]` —
    advisors + inspect always; Soda only when `config.audit.soda` is set and the
    target is a `dbUrl` (with `--linked` there is no password, so Soda is
    skipped with a line on stderr from the command, not here)
  - `auditCommand(argv, io): number` — options `--linked`, `--db-url <url>`,
    `--json`; exit codes as `check`

- [ ] **Step 1: Save the advisors fixture**

```bash
(cd ~/p/verticagtm && supabase db advisors --linked --type all --output-format json) > packages/db-quality/tests/fixtures/reports/advisors.json
```

Then reduce it: keep the `results` array's first three entries (the
`security_definer_view` error and two warnings) and replace every
`public.<name>` in `detail`, `metadata.name` and `cache_key` with
`public.example_view`, `public.example_table`, `public.example_fn`. The fixture
is committed; it must not name real objects.

- [ ] **Step 2: Write the failing tests**

`tests/adapters/supabase/parseAdvisorReport.test.ts`:

```ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { parseAdvisorReport } from '@/adapters/supabase/parseAdvisorReport.js'

const stdout = readFileSync(
  new URL('../../fixtures/reports/advisors.json', import.meta.url),
  'utf8',
)

describe('parseAdvisorReport', () => {
  it('maps results to BDB500 findings with the splinter name', () => {
    const findings = parseAdvisorReport(stdout, [])
    expect(findings).toHaveLength(3)
    expect(findings[0]).toMatchObject({
      code: 'BDB500/security_definer_view',
      severity: 'error',
      path: 'supabase',
      line: 0,
      subject: 'public.example_view',
    })
    expect(findings[0]?.message).not.toContain('\\`')
  })
  it('drops disabled codes', () => {
    expect(
      parseAdvisorReport(stdout, ['BDB500/security_definer_view']).map(
        (f) => f.code,
      ),
    ).not.toContain('BDB500/security_definer_view')
  })
})
```

`tests/adapters/supabase/parseCliError.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { parseCliError } from '@/adapters/supabase/parseCliError.js'

describe('parseCliError', () => {
  it('extracts the error document the CLI prints', () => {
    expect(
      parseCliError(
        'Initialising login role...\n{"_tag":"Error","error":{"code":"LegacyDbAdvisorsSecurityStatusError","message":"unexpected security advisors status 401: {\\"message\\":\\"Unauthorized\\"}"}}',
      ),
    ).toEqual({
      code: 'LegacyDbAdvisorsSecurityStatusError',
      message: expect.stringContaining('401'),
    })
  })
  it('returns undefined for a normal document', () => {
    expect(parseCliError('{"results":[]}')).toBeUndefined()
  })
})
```

`tests/adapters/supabase/runAdvisors.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { runAdvisors } from '@/adapters/supabase/runAdvisors.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

describe('runAdvisors', () => {
  it('passes --linked or --db-url', () => {
    const calls: string[][] = []
    const runner: CommandRunner = (_c, args) => {
      calls.push(args)
      return { status: 0, stdout: '{"results":[]}', stderr: '', missing: false }
    }
    runAdvisors(runner, '/p', { linked: true }, [])
    runAdvisors(runner, '/p', { dbUrl: 'postgres://u:p@h/d' }, [])
    expect(calls[0]).toEqual([
      'db',
      'advisors',
      '--type',
      'all',
      '--output-format',
      'json',
      '--linked',
    ])
    expect(calls[1]).toEqual([
      'db',
      'advisors',
      '--type',
      'all',
      '--output-format',
      'json',
      '--db-url',
      'postgres://u:p@h/d',
    ])
  })
  it('turns an auth failure into an error naming the account problem', () => {
    const runner: CommandRunner = () => ({
      status: 1,
      stdout: '{"_tag":"Error","error":{"code":"X","message":"status 403"}}',
      stderr: '',
      missing: false,
    })
    expect(() => runAdvisors(runner, '/p', { linked: true }, [])).toThrow(
      /supabase advisors failed: X: status 403/,
    )
  })
  it('raises ToolMissingError when the CLI is absent', () => {
    expect(() =>
      runAdvisors(
        () => ({ status: -1, stdout: '', stderr: '', missing: true }),
        '/p',
        { linked: true },
        [],
      ),
    ).toThrow(ToolMissingError)
  })
})
```

`tests/adapters/supabase/parseInspect.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { parseBloat } from '@/adapters/supabase/parseBloat.js'
import { parseIndexStats } from '@/adapters/supabase/parseIndexStats.js'

describe('parseIndexStats', () => {
  it('reports unused indexes but never primary keys', () => {
    const stdout = JSON.stringify({
      rows: [
        {
          name: 'public.a_idx',
          table: 'public.a',
          columns: 'x',
          size: '8 kB',
          percent_used: '0%',
          index_scans: '0',
          seq_scans: '4',
          unused: true,
        },
        {
          name: 'public.a_pkey',
          table: 'public.a',
          columns: 'id',
          size: '8 kB',
          percent_used: '0%',
          index_scans: '0',
          seq_scans: '4',
          unused: true,
        },
        {
          name: 'public.b_idx',
          table: 'public.b',
          columns: 'y',
          size: '8 kB',
          percent_used: '100%',
          index_scans: '25711',
          seq_scans: '0',
          unused: false,
        },
      ],
    })
    expect(
      parseIndexStats(stdout, []).map((f) => [f.code, f.subject, f.severity]),
    ).toEqual([['BDB601', 'public.a_idx', 'info']])
  })
})

describe('parseBloat', () => {
  it('reports rows over the threshold', () => {
    const stdout = JSON.stringify({
      rows: [
        { type: 'table', name: 'public.plans', bloat: '3.8', waste: '200 kB' },
        { type: 'table', name: 'public.big', bloat: '7.1', waste: '3 MB' },
      ],
    })
    expect(
      parseBloat(stdout, 5, []).map((f) => [f.code, f.subject, f.message]),
    ).toEqual([['BDB602', 'public.big', 'bloat factor 7.1, 3 MB wasted']])
  })
})
```

`tests/adapters/supabase/runInspect.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { runInspect } from '@/adapters/supabase/runInspect.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

describe('runInspect', () => {
  it('runs index-stats and bloat against the target', () => {
    const calls: string[][] = []
    const runner: CommandRunner = (_c, args) => {
      calls.push(args)
      return { status: 0, stdout: '{"rows":[]}', stderr: '', missing: false }
    }
    expect(runInspect(runner, '/p', { linked: true }, 5, [])).toEqual([])
    expect(calls).toEqual([
      ['inspect', 'db', 'index-stats', '--output-format', 'json', '--linked'],
      ['inspect', 'db', 'bloat', '--output-format', 'json', '--linked'],
    ])
  })
})
```

`tests/adapters/soda/renderSodaConfiguration.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { dataSourceType } from '@/adapters/soda/dataSourceType.js'
import { renderSodaConfiguration } from '@/adapters/soda/renderSodaConfiguration.js'
import { ConfigError } from '@/config/ConfigError.js'

describe('renderSodaConfiguration', () => {
  it('renders the postgres block from the URL', () => {
    expect(
      renderSodaConfiguration(
        'codeality',
        'postgresql://user:pa%40ss@db.example.com:6543/postgres',
      ),
    ).toBe(
      'data_source codeality:\n  type: postgres\n  host: db.example.com\n  port: 6543\n  username: user\n  password: "pa@ss"\n  database: postgres\n  schema: public\n',
    )
  })
  it('knows the two source types and rejects others', () => {
    expect(dataSourceType('mysql://u:p@h/d')).toBe('mysql')
    expect(() => dataSourceType('sqlite:///x.db')).toThrow(ConfigError)
  })
})
```

`tests/adapters/soda/parseSodaResults.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { parseSodaResults } from '@/adapters/soda/parseSodaResults.js'

describe('parseSodaResults', () => {
  it('reports failed and warned checks only', () => {
    const json = JSON.stringify({
      checks: [
        {
          name: 'duplicate_count(email) = 0',
          outcome: 'fail',
          table: 'users',
          column: 'email',
        },
        { name: 'row_count > 0', outcome: 'pass', table: 'users' },
        {
          name: 'missing_count(id) = 0',
          outcome: 'warn',
          table: 'users',
          column: 'id',
        },
      ],
    })
    expect(
      parseSodaResults(json, 'db-quality/soda', []).map((f) => [
        f.code,
        f.severity,
        f.subject,
        f.path,
      ]),
    ).toEqual([
      [
        'BDB700/duplicate_count(email) = 0',
        'error',
        'users.email',
        'db-quality/soda/checks.yml',
      ],
      [
        'BDB700/missing_count(id) = 0',
        'warn',
        'users.id',
        'db-quality/soda/checks.yml',
      ],
    ])
  })
})
```

`tests/adapters/soda/runSoda.test.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { runSoda } from '@/adapters/soda/runSoda.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

describe('runSoda', () => {
  it('writes the configuration, runs uvx with the shim, reads the results file', () => {
    let seen: string[] = []
    const runner: CommandRunner = (command, args) => {
      seen = [command, ...args]
      const results = args[args.indexOf('-srf') + 1] as string
      writeFileSync(
        results,
        '{"checks":[{"name":"row_count > 0","outcome":"fail","table":"t"}]}',
      )
      expect(
        readFileSync(args[args.indexOf('-c') + 1] as string, 'utf8'),
      ).toContain('type: postgres')
      return { status: 2, stdout: '', stderr: '', missing: false }
    }
    const findings = runSoda(
      runner,
      '/p',
      'db-quality/soda',
      'postgres://u:p@h:5432/d',
      [],
    )
    expect(findings.map((f) => f.code)).toEqual(['BDB700/row_count > 0'])
    expect(seen.slice(0, 6)).toEqual([
      'uvx',
      '--with',
      'setuptools',
      '--from',
      'soda-core-postgres',
      'soda',
    ])
    expect(seen.at(-1)).toBe('db-quality/soda/checks.yml')
  })
})
```

`tests/audit/resolveAuditTarget.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { resolveAuditTarget } from '@/audit/resolveAuditTarget.js'
import { ConfigError } from '@/config/ConfigError.js'

describe('resolveAuditTarget', () => {
  it('prefers --db-url, accepts --linked only when the project is linked', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(
      resolveAuditTarget(root, { 'db-url': 'postgres://x', linked: true }),
    ).toEqual({ dbUrl: 'postgres://x' })
    expect(() => resolveAuditTarget(root, { linked: true })).toThrow(
      /not linked/,
    )
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/project-ref'), 'abc')
    expect(resolveAuditTarget(root, { linked: true })).toEqual({ linked: true })
    expect(() => resolveAuditTarget(root, {})).toThrow(ConfigError)
  })
})
```

`tests/audit/runAudit.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { runAudit } from '@/audit/runAudit.js'
import { validateConfigDocument } from '@/config/validateConfigDocument.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

describe('runAudit', () => {
  it('runs advisors and inspect, and Soda only with a db url', () => {
    const commands: string[] = []
    const runner: CommandRunner = (command, args) => {
      commands.push(`${command} ${args[0]}`)
      return {
        status: 0,
        stdout:
          command === 'supabase' && args[0] === 'db'
            ? '{"results":[]}'
            : '{"rows":[]}',
        stderr: '',
        missing: false,
      }
    }
    const config = validateConfigDocument({
      schemaVersion: 1,
      audit: { soda: 'db-quality/soda' },
    })
    runAudit({ root: '/p', config, runner, target: { linked: true } })
    expect(commands).toEqual([
      'supabase db',
      'supabase inspect',
      'supabase inspect',
    ])
  })
})
```

`tests/commands/auditCommand.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { auditCommand } from '@/commands/auditCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

describe('auditCommand', () => {
  it('exits 2 without a target and 3 on an auth failure', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    const err: string[] = []
    const denied: CommandRunner = () => ({
      status: 1,
      stdout: '{"_tag":"Error","error":{"code":"X","message":"status 403"}}',
      stderr: '',
      missing: false,
    })
    const io = {
      root,
      runner: denied,
      stdout: () => {},
      stderr: (s: string) => err.push(s),
    }
    expect(auditCommand([], io)).toBe(2)
    expect(auditCommand(['--db-url', 'postgres://u:p@h/d'], io)).toBe(3)
    expect(err.join('')).toMatch(/403/)
  })
})
```

- [ ] **Step 3: Run the tests to see them fail**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/supabase tests/adapters/soda tests/audit tests/commands/auditCommand.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement the Supabase adapters**

`src/adapters/supabase/AdvisorEntry.ts`:

```ts
export type AdvisorEntry = {
  name: string
  title: string
  level: 'ERROR' | 'WARN' | 'INFO'
  detail: string
  metadata?: { name?: string; schema?: string; type?: string }
}
```

`src/adapters/supabase/parseAdvisorReport.ts`:

```ts
import type { AdvisorEntry } from '@/adapters/supabase/AdvisorEntry.js'
import { isDisabled } from '@/config/isDisabled.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'
import type { Severity } from '@/model/Severity.js'

export const parseAdvisorReport = (
  stdout: string,
  disabled: string[],
): Finding[] => {
  const { results } = JSON.parse(stdout) as { results: AdvisorEntry[] }
  const severity: Record<AdvisorEntry['level'], Severity> = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
  }
  return results.flatMap((entry) => {
    const code = `BDB500/${entry.name}`
    if (isDisabled(code, disabled)) return []
    const subject =
      entry.metadata?.schema && entry.metadata.name
        ? `${entry.metadata.schema}.${entry.metadata.name}`
        : ''
    const partial = {
      code,
      severity: severity[entry.level],
      path: 'supabase',
      line: 0,
      message: entry.detail.replaceAll('\\`', '`'),
      subject,
    }
    return [
      { ...partial, fingerprint: fingerprintFinding(partial, entry.detail) },
    ]
  })
}
```

`src/adapters/supabase/CliError.ts`:

```ts
export type CliError = { code: string; message: string }
```

`src/adapters/supabase/parseCliError.ts`:

```ts
import type { CliError } from '@/adapters/supabase/CliError.js'

// The CLI prints progress lines before the document, so the JSON is searched
// for rather than parsed from the first byte.
export const parseCliError = (text: string): CliError | undefined => {
  const start = text.indexOf('{"_tag":"Error"')
  if (start === -1) return undefined
  try {
    const { error } = JSON.parse(text.slice(start)) as { error: CliError }
    return { code: error.code, message: error.message }
  } catch {
    return { code: 'unknown', message: text.slice(start, start + 200) }
  }
}
```

`src/adapters/supabase/runAdvisors.ts`:

```ts
import { parseAdvisorReport } from '@/adapters/supabase/parseAdvisorReport.js'
import { parseCliError } from '@/adapters/supabase/parseCliError.js'
import type { AuditTarget } from '@/audit/AuditTarget.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

export const runAdvisors = (
  runner: CommandRunner,
  root: string,
  target: AuditTarget,
  disabled: string[],
): Finding[] => {
  const targetArgs =
    'dbUrl' in target ? ['--db-url', target.dbUrl] : ['--linked']
  const result = runner(
    'supabase',
    [
      'db',
      'advisors',
      '--type',
      'all',
      '--output-format',
      'json',
      ...targetArgs,
    ],
    { cwd: root },
  )
  if (result.missing)
    throw new ToolMissingError('supabase', 'install the Supabase CLI')
  const failure = parseCliError(`${result.stdout}\n${result.stderr}`)
  if (failure || result.status !== 0)
    throw new Error(
      `supabase advisors failed: ${failure?.code ?? result.status}: ${failure?.message ?? result.stderr.trim()}`,
    )
  return parseAdvisorReport(
    result.stdout.slice(result.stdout.indexOf('{')),
    disabled,
  )
}
```

`src/adapters/supabase/IndexStatRow.ts`, `BloatRow.ts`:

```ts
export type IndexStatRow = {
  name: string
  table: string
  size: string
  index_scans: string
  unused: boolean
}
```

```ts
export type BloatRow = {
  type: string
  name: string
  bloat: string
  waste: string
}
```

`src/adapters/supabase/parseIndexStats.ts`:

```ts
import type { IndexStatRow } from '@/adapters/supabase/IndexStatRow.js'
import { isDisabled } from '@/config/isDisabled.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'

export const parseIndexStats = (
  stdout: string,
  disabled: string[],
): Finding[] => {
  if (isDisabled('BDB601', disabled)) return []
  const { rows } = JSON.parse(stdout) as { rows: IndexStatRow[] }
  return rows
    .filter(
      (row) =>
        (row.unused || row.index_scans === '0') && !row.name.endsWith('_pkey'),
    )
    .map((row) => {
      const partial = {
        code: 'BDB601',
        severity: 'info' as const,
        path: 'supabase',
        line: 0,
        message: `index has never been scanned (${row.size})`,
        subject: row.name,
      }
      return { ...partial, fingerprint: fingerprintFinding(partial, row.name) }
    })
}
```

`src/adapters/supabase/parseBloat.ts`:

```ts
import type { BloatRow } from '@/adapters/supabase/BloatRow.js'
import { isDisabled } from '@/config/isDisabled.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'

export const parseBloat = (
  stdout: string,
  threshold: number,
  disabled: string[],
): Finding[] => {
  if (isDisabled('BDB602', disabled)) return []
  const { rows } = JSON.parse(stdout) as { rows: BloatRow[] }
  return rows
    .filter((row) => Number(row.bloat) > threshold)
    .map((row) => {
      const partial = {
        code: 'BDB602',
        severity: 'warn' as const,
        path: 'supabase',
        line: 0,
        message: `bloat factor ${row.bloat}, ${row.waste} wasted`,
        subject: row.name,
      }
      return { ...partial, fingerprint: fingerprintFinding(partial, row.name) }
    })
}
```

`src/adapters/supabase/runInspect.ts`:

```ts
import { parseBloat } from '@/adapters/supabase/parseBloat.js'
import { parseCliError } from '@/adapters/supabase/parseCliError.js'
import { parseIndexStats } from '@/adapters/supabase/parseIndexStats.js'
import type { AuditTarget } from '@/audit/AuditTarget.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

export const runInspect = (
  runner: CommandRunner,
  root: string,
  target: AuditTarget,
  threshold: number,
  disabled: string[],
): Finding[] => {
  const targetArgs =
    'dbUrl' in target ? ['--db-url', target.dbUrl] : ['--linked']
  const query = (report: string): string => {
    const result = runner(
      'supabase',
      ['inspect', 'db', report, '--output-format', 'json', ...targetArgs],
      { cwd: root },
    )
    if (result.missing)
      throw new ToolMissingError('supabase', 'install the Supabase CLI')
    const failure = parseCliError(`${result.stdout}\n${result.stderr}`)
    if (failure || result.status !== 0)
      throw new Error(
        `supabase inspect ${report} failed: ${failure?.code ?? result.status}: ${failure?.message ?? result.stderr.trim()}`,
      )
    return result.stdout.slice(result.stdout.indexOf('{'))
  }
  return [
    ...parseIndexStats(query('index-stats'), disabled),
    ...parseBloat(query('bloat'), threshold, disabled),
  ]
}
```

- [ ] **Step 5: Implement the Soda adapter**

`src/adapters/soda/dataSourceType.ts`:

```ts
import { ConfigError } from '@/config/ConfigError.js'

export const dataSourceType = (url: string): 'postgres' | 'mysql' => {
  const scheme = url.split(':')[0] ?? ''
  if (scheme === 'postgres' || scheme === 'postgresql') return 'postgres'
  if (scheme === 'mysql') return 'mysql'
  throw new ConfigError(
    `Soda supports postgres and mysql URLs, not "${scheme}"`,
  )
}
```

`src/adapters/soda/renderSodaConfiguration.ts`:

```ts
import { dataSourceType } from '@/adapters/soda/dataSourceType.js'

export const renderSodaConfiguration = (name: string, url: string): string => {
  const type = dataSourceType(url)
  const parsed = new URL(url)
  const lines = [
    `data_source ${name}:`,
    `  type: ${type}`,
    `  host: ${parsed.hostname}`,
    `  port: ${parsed.port || (type === 'postgres' ? '5432' : '3306')}`,
    `  username: ${decodeURIComponent(parsed.username)}`,
    `  password: ${JSON.stringify(decodeURIComponent(parsed.password))}`,
    `  database: ${parsed.pathname.slice(1)}`,
    ...(type === 'postgres' ? ['  schema: public'] : []),
  ]
  return `${lines.join('\n')}\n`
}
```

`src/adapters/soda/SodaCheckResult.ts`:

```ts
export type SodaCheckResult = {
  name: string
  outcome: 'pass' | 'fail' | 'warn' | 'error'
  table?: string
  column?: string
}
```

`src/adapters/soda/parseSodaResults.ts`:

```ts
import type { SodaCheckResult } from '@/adapters/soda/SodaCheckResult.js'
import { isDisabled } from '@/config/isDisabled.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import type { Finding } from '@/model/Finding.js'

export const parseSodaResults = (
  json: string,
  sodaDir: string,
  disabled: string[],
): Finding[] => {
  const { checks } = JSON.parse(json) as { checks: SodaCheckResult[] }
  return checks.flatMap((check) => {
    if (check.outcome !== 'fail' && check.outcome !== 'warn') return []
    const code = `BDB700/${check.name}`
    if (isDisabled(code, disabled)) return []
    const subject = [check.table, check.column].filter(Boolean).join('.')
    const partial = {
      code,
      severity:
        check.outcome === 'fail' ? ('error' as const) : ('warn' as const),
      path: `${sodaDir}/checks.yml`,
      line: 0,
      message: `check ${check.outcome}ed: ${check.name}`,
      subject,
    }
    return [
      { ...partial, fingerprint: fingerprintFinding(partial, check.name) },
    ]
  })
}
```

`src/adapters/soda/runSoda.ts`:

```ts
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { dataSourceType } from '@/adapters/soda/dataSourceType.js'
import { parseSodaResults } from '@/adapters/soda/parseSodaResults.js'
import { renderSodaConfiguration } from '@/adapters/soda/renderSodaConfiguration.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// `--with setuptools` and SETUPTOOLS_USE_DISTUTILS are not optional: Soda 4.25
// imports distutils, which Python 3.12 removed. Measured 2026-09-25.
export const runSoda = (
  runner: CommandRunner,
  root: string,
  sodaDir: string,
  url: string,
  disabled: string[],
): Finding[] => {
  const scratch = mkdtempSync(join(tmpdir(), 'codeality-db-soda-'))
  try {
    const configuration = join(scratch, 'configuration.yml')
    const results = join(scratch, 'results.json')
    writeFileSync(configuration, renderSodaConfiguration('codeality', url))
    const result = runner(
      'uvx',
      [
        '--with',
        'setuptools',
        '--from',
        `soda-core-${dataSourceType(url)}`,
        'soda',
        'scan',
        '-d',
        'codeality',
        '-c',
        configuration,
        '-srf',
        results,
        `${sodaDir}/checks.yml`,
      ],
      { cwd: root, env: { SETUPTOOLS_USE_DISTUTILS: 'local' } },
    )
    if (result.missing) throw new ToolMissingError('uvx', 'install uv')
    if (!existsSync(results))
      throw new Error(
        `soda scan produced no results (exit ${result.status}): ${result.stderr.trim().slice(-500)}`,
      )
    return parseSodaResults(readFileSync(results, 'utf8'), sodaDir, disabled)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
```

- [ ] **Step 6: Implement the audit composition and command**

`src/audit/AuditTarget.ts`:

```ts
export type AuditTarget = { linked: true } | { dbUrl: string }
```

`src/audit/resolveAuditTarget.ts`:

```ts
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { AuditTarget } from '@/audit/AuditTarget.js'
import { ConfigError } from '@/config/ConfigError.js'

export const resolveAuditTarget = (
  root: string,
  values: { linked?: boolean; 'db-url'?: string },
): AuditTarget => {
  if (values['db-url']) return { dbUrl: values['db-url'] }
  if (values.linked) {
    if (!existsSync(join(root, 'supabase/.temp/project-ref')))
      throw new ConfigError(
        'project is not linked; run "supabase link" or pass --db-url',
      )
    return { linked: true }
  }
  throw new ConfigError('audit needs --linked or --db-url')
}
```

`src/audit/runAudit.ts`:

```ts
import { runSoda } from '@/adapters/soda/runSoda.js'
import { runAdvisors } from '@/adapters/supabase/runAdvisors.js'
import { runInspect } from '@/adapters/supabase/runInspect.js'
import type { AuditTarget } from '@/audit/AuditTarget.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const runAudit = ({
  root,
  config,
  runner,
  target,
}: {
  root: string
  config: DbQualityConfig
  runner: CommandRunner
  target: AuditTarget
}): Finding[] => {
  const findings = [
    ...runAdvisors(runner, root, target, config.disable),
    ...runInspect(
      runner,
      root,
      target,
      config.audit.bloatThreshold,
      config.disable,
    ),
  ]
  if (config.audit.soda && 'dbUrl' in target)
    findings.push(
      ...runSoda(runner, root, config.audit.soda, target.dbUrl, config.disable),
    )
  return findings.sort(compareFindings)
}
```

`src/commands/auditCommand.ts`:

```ts
import { resolveAuditTarget } from '@/audit/resolveAuditTarget.js'
import { runAudit } from '@/audit/runAudit.js'
import { renderFindings } from '@/check/renderFindings.js'
import { renderFindingsJson } from '@/check/renderFindingsJson.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { ConfigError } from '@/config/ConfigError.js'
import { readConfig } from '@/config/readConfig.js'
import { ExitCode } from '@/model/ExitCode.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const auditCommand = (
  argv: string[],
  io: {
    root: string
    runner: CommandRunner
    stdout: (s: string) => void
    stderr: (s: string) => void
  },
): number => {
  try {
    const { values } = parseCommandArgs(argv, {
      json: { type: 'boolean' },
      linked: { type: 'boolean' },
      'db-url': { type: 'string' },
    })
    const config = readConfig(io.root)
    const target = resolveAuditTarget(io.root, {
      linked: values['linked'] === true,
      'db-url': values['db-url'] as string | undefined,
    })
    if (config.audit.soda && !('dbUrl' in target))
      io.stderr(
        'soda: skipped, a linked target carries no database password; pass --db-url\n',
      )
    const findings = runAudit({
      root: io.root,
      config,
      runner: io.runner,
      target,
    })
    io.stdout(
      `${values['json'] === true ? renderFindingsJson(findings) : renderFindings(findings)}\n`,
    )
    return findings.length > 0 ? ExitCode.FINDINGS : ExitCode.OK
  } catch (error) {
    io.stderr(
      `${error instanceof ConfigError ? 'configuration error' : 'error'}: ${(error as Error).message}\n`,
    )
    return error instanceof ConfigError
      ? ExitCode.CONFIGURATION
      : ExitCode.INFRASTRUCTURE
  }
}
```

- [ ] **Step 7: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/adapters/supabase tests/adapters/soda tests/audit tests/commands && pnpm --filter @syntopica/db-quality lint`
Expected: PASS.

```bash
git add packages/db-quality/src/adapters/supabase packages/db-quality/src/adapters/soda packages/db-quality/src/audit packages/db-quality/src/commands/auditCommand.ts packages/db-quality/tests/adapters/supabase packages/db-quality/tests/adapters/soda packages/db-quality/tests/audit packages/db-quality/tests/commands/auditCommand.test.ts packages/db-quality/tests/fixtures/reports/advisors.json
git commit -m "feat(db-quality): live audit through Supabase advisors, inspect and Soda"
```

---

### Task 14: Gate

**Files:**

- Create: `src/gate/StageStatus.ts`, `src/gate/StageResult.ts`,
  `src/gate/Stage.ts`, `src/gate/runStage.ts`, `src/gate/gateStages.ts`,
  `src/gate/runGate.ts`, `src/gate/gateExitCode.ts`,
  `src/gate/renderGateReport.ts`, `src/commands/gateCommand.ts`
- Test: `tests/gate/runStage.test.ts`, `tests/gate/gateStages.test.ts`,
  `tests/gate/gateExitCode.test.ts`, `tests/gate/renderGateReport.test.ts`,
  `tests/commands/gateCommand.test.ts`

**Interfaces:**

- Consumes: `runCheck`, `classifyFindings`, `readBaseline`, `runAudit`,
  `ToolMissingError`, `ExitCode`, `renderFindings`.
- Produces:
  - `type StageStatus = 'passed' | 'findings' | 'failed-to-run' | 'skipped-not-applicable'`
  - `type StageResult = { name: string; status: StageStatus; durationSeconds: number; detail: string }`
  - `type Stage = { name: string; run: () => Finding[] | 'not-applicable' }`
  - `runStage(stage): StageResult` — `passed` when the run returns `[]`;
    `findings` with `renderFindings` as detail; `skipped-not-applicable` when it
    returns `'not-applicable'`; `failed-to-run` when it throws, with the message
    as detail
  - `gateStages(context: CheckContext): Stage[]`:
    1. `check` when no baseline file exists: `runCheck`; or `baseline-check`:
       `classifyFindings(runCheck(...), readBaseline(root)).new`
    2. `audit`: `'not-applicable'` when `config.audit.inGate === false` or
       `supabase/.temp/project-ref` is absent; else `runAudit` with
       `{ linked: true }`
  - `runGate(stages): StageResult[]` — runs all of them, never stops early
  - `gateExitCode(results): number` — 3 if any `failed-to-run`, else 1 if any
    `findings`, else 0
  - `renderGateReport(results): string` — one line per stage:
    `<status padded to 22> <name padded to 14> <seconds>s` then, for non-passed
    stages, the detail indented by two spaces
  - `gateCommand(argv, io): number` — `--json` prints
    `{"schemaVersion":1,"stages":[...]}`; `ConfigError` from reading the config
    → 2

- [ ] **Step 1: Write the failing tests**

`tests/gate/runStage.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { runStage } from '@/gate/runStage.js'

const finding = {
  code: 'BDB001',
  severity: 'warn' as const,
  path: 'a',
  line: 1,
  message: 'm',
  subject: '',
  fingerprint: 'x',
}

describe('runStage', () => {
  it.each([
    [() => [], 'passed'],
    [() => [finding], 'findings'],
    [() => 'not-applicable' as const, 'skipped-not-applicable'],
    [
      () => {
        throw new Error('squawk is not installed')
      },
      'failed-to-run',
    ],
  ])('classifies %s as %s', (run, status) => {
    const result = runStage({ name: 's', run })
    expect(result.status).toBe(status)
    expect(result.durationSeconds).toBeGreaterThanOrEqual(0)
  })
  it('carries the rendered findings or the error as detail', () => {
    expect(runStage({ name: 's', run: () => [finding] }).detail).toBe(
      'a:1: BDB001 m\n1 findings',
    )
    expect(
      runStage({
        name: 's',
        run: () => {
          throw new Error('boom')
        },
      }).detail,
    ).toBe('boom')
  })
})
```

`tests/gate/gateStages.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { validateConfigDocument } from '@/config/validateConfigDocument.js'
import { gateStages } from '@/gate/gateStages.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const runner: CommandRunner = () => ({
  status: 0,
  stdout: '{"results":[],"rows":[]}',
  stderr: '',
  missing: false,
})

describe('gateStages', () => {
  it('uses check without a baseline and baseline-check with one', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const config = validateConfigDocument({ schemaVersion: 1 })
    expect(gateStages({ root, config, runner }).map((s) => s.name)).toEqual([
      'check',
      'audit',
    ])
    writeFileSync(
      join(root, '.codeality-db-baseline.json'),
      '{"schemaVersion":1,"toolVersion":"0","entries":[]}',
    )
    expect(gateStages({ root, config, runner })[0]?.name).toBe('baseline-check')
  })
  it('marks audit not applicable when unlinked or switched off, and runs it when linked', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const on = validateConfigDocument({ schemaVersion: 1 })
    expect(gateStages({ root, config: on, runner })[1]?.run()).toBe(
      'not-applicable',
    )
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/project-ref'), 'abc')
    expect(gateStages({ root, config: on, runner })[1]?.run()).toEqual([])
    const off = validateConfigDocument({
      schemaVersion: 1,
      audit: { inGate: false },
    })
    expect(gateStages({ root, config: off, runner })[1]?.run()).toBe(
      'not-applicable',
    )
  })
})
```

`tests/gate/gateExitCode.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { gateExitCode } from '@/gate/gateExitCode.js'
import type { StageResult } from '@/gate/StageResult.js'

const result = (status: StageResult['status']): StageResult => ({
  name: 's',
  status,
  durationSeconds: 0,
  detail: '',
})

describe('gateExitCode', () => {
  it('ranks failed-to-run over findings over everything else', () => {
    expect(
      gateExitCode([result('passed'), result('skipped-not-applicable')]),
    ).toBe(0)
    expect(gateExitCode([result('passed'), result('findings')])).toBe(1)
    expect(gateExitCode([result('findings'), result('failed-to-run')])).toBe(3)
  })
})
```

`tests/gate/renderGateReport.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { renderGateReport } from '@/gate/renderGateReport.js'

describe('renderGateReport', () => {
  it('prints one line per stage and the detail of the ones that did not pass', () => {
    expect(
      renderGateReport([
        { name: 'check', status: 'passed', durationSeconds: 1.234, detail: '' },
        {
          name: 'audit',
          status: 'failed-to-run',
          durationSeconds: 0.5,
          detail: 'supabase advisors failed: X: status 403',
        },
      ]),
    ).toBe(
      '                passed  check             1.23s\n         failed-to-run  audit             0.50s\n  supabase advisors failed: X: status 403',
    )
  })
})
```

`tests/commands/gateCommand.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { gateCommand } from '@/commands/gateCommand.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

describe('gateCommand', () => {
  it('returns 3 when a linked audit cannot authenticate, even with a clean check', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/project-ref'), 'abc')
    const denied: CommandRunner = () => ({
      status: 1,
      stdout: '{"_tag":"Error","error":{"code":"X","message":"status 401"}}',
      stderr: '',
      missing: false,
    })
    const out: string[] = []
    expect(
      gateCommand([], {
        root,
        runner: denied,
        stdout: (s) => out.push(s),
        stderr: () => {},
      }),
    ).toBe(3)
    expect(out.join('')).toMatch(/failed-to-run\s+audit/)
  })
  it('returns 0 for an unlinked clean project and prints JSON on request', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    const out: string[] = []
    expect(
      gateCommand(['--json'], {
        root,
        runner: () => ({ status: 0, stdout: '', stderr: '', missing: false }),
        stdout: (s) => out.push(s),
        stderr: () => {},
      }),
    ).toBe(0)
    expect(
      JSON.parse(out.join('')).stages.map(
        (s: { name: string; status: string }) => [s.name, s.status],
      ),
    ).toEqual([
      ['check', 'passed'],
      ['audit', 'skipped-not-applicable'],
    ])
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/gate tests/commands/gateCommand.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/gate/StageStatus.ts`:

```ts
/** A required stage that could not run is a failure, never a skip. */
export type StageStatus =
  'passed' | 'findings' | 'failed-to-run' | 'skipped-not-applicable'
```

`src/gate/StageResult.ts`:

```ts
import type { StageStatus } from '@/gate/StageStatus.js'

export type StageResult = {
  name: string
  status: StageStatus
  durationSeconds: number
  detail: string
}
```

`src/gate/Stage.ts`:

```ts
import type { Finding } from '@/model/Finding.js'

export type Stage = { name: string; run: () => Finding[] | 'not-applicable' }
```

`src/gate/runStage.ts`:

```ts
import { performance } from 'node:perf_hooks'

import { renderFindings } from '@/check/renderFindings.js'
import type { Stage } from '@/gate/Stage.js'
import type { StageResult } from '@/gate/StageResult.js'

export const runStage = (stage: Stage): StageResult => {
  const started = performance.now()
  const elapsed = (): number => (performance.now() - started) / 1000
  try {
    const outcome = stage.run()
    if (outcome === 'not-applicable')
      return {
        name: stage.name,
        status: 'skipped-not-applicable',
        durationSeconds: elapsed(),
        detail: '',
      }
    if (outcome.length === 0)
      return {
        name: stage.name,
        status: 'passed',
        durationSeconds: elapsed(),
        detail: '',
      }
    return {
      name: stage.name,
      status: 'findings',
      durationSeconds: elapsed(),
      detail: renderFindings(outcome),
    }
  } catch (error) {
    return {
      name: stage.name,
      status: 'failed-to-run',
      durationSeconds: elapsed(),
      detail: (error as Error).message,
    }
  }
}
```

`src/gate/gateStages.ts`:

```ts
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { runAudit } from '@/audit/runAudit.js'
import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import { classifyFindings } from '@/baseline/classifyFindings.js'
import { readBaseline } from '@/baseline/readBaseline.js'
import type { CheckContext } from '@/check/CheckContext.js'
import { runCheck } from '@/check/runCheck.js'
import type { Stage } from '@/gate/Stage.js'

// A recorded baseline is the migration plan; the gate must honour it, or
// recording debt could never turn the gate green. Audit runs when the project
// is linked unless the configuration says otherwise: a linked project whose
// CI has no token must switch it off explicitly rather than pass by accident.
export const gateStages = (context: CheckContext): Stage[] => {
  const hasBaseline = existsSync(join(context.root, BASELINE_FILENAME))
  const linked = existsSync(join(context.root, 'supabase/.temp/project-ref'))
  return [
    hasBaseline
      ? {
          name: 'baseline-check',
          run: () =>
            classifyFindings(runCheck(context), readBaseline(context.root)).new,
        }
      : { name: 'check', run: () => runCheck(context) },
    {
      name: 'audit',
      run: () =>
        context.config.audit.inGate && linked
          ? runAudit({ ...context, target: { linked: true } })
          : 'not-applicable',
    },
  ]
}
```

`src/gate/runGate.ts`:

```ts
import { runStage } from '@/gate/runStage.js'
import type { Stage } from '@/gate/Stage.js'
import type { StageResult } from '@/gate/StageResult.js'

// Every stage runs: stopping at the first failure means the same tool is
// fixed over and over and the rest of the picture never appears.
export const runGate = (stages: Stage[]): StageResult[] => stages.map(runStage)
```

`src/gate/gateExitCode.ts`:

```ts
import type { StageResult } from '@/gate/StageResult.js'
import { ExitCode } from '@/model/ExitCode.js'

export const gateExitCode = (results: StageResult[]): number => {
  if (results.some((result) => result.status === 'failed-to-run'))
    return ExitCode.INFRASTRUCTURE
  if (results.some((result) => result.status === 'findings'))
    return ExitCode.FINDINGS
  return ExitCode.OK
}
```

`src/gate/renderGateReport.ts`:

```ts
import type { StageResult } from '@/gate/StageResult.js'

export const renderGateReport = (results: StageResult[]): string =>
  results
    .flatMap((result) => [
      `${result.status.padStart(22)}  ${result.name.padEnd(14)}${result.durationSeconds.toFixed(2).padStart(8)}s`,
      ...(result.status === 'passed' ||
      result.status === 'skipped-not-applicable' ||
      !result.detail
        ? []
        : result.detail.split('\n').map((line) => `  ${line}`)),
    ])
    .join('\n')
```

`src/commands/gateCommand.ts`:

```ts
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { ConfigError } from '@/config/ConfigError.js'
import { readConfig } from '@/config/readConfig.js'
import { gateExitCode } from '@/gate/gateExitCode.js'
import { gateStages } from '@/gate/gateStages.js'
import { renderGateReport } from '@/gate/renderGateReport.js'
import { runGate } from '@/gate/runGate.js'
import { ExitCode } from '@/model/ExitCode.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const gateCommand = (
  argv: string[],
  io: {
    root: string
    runner: CommandRunner
    stdout: (s: string) => void
    stderr: (s: string) => void
  },
): number => {
  try {
    const { values } = parseCommandArgs(argv, { json: { type: 'boolean' } })
    const results = runGate(
      gateStages({
        root: io.root,
        config: readConfig(io.root),
        runner: io.runner,
      }),
    )
    io.stdout(
      `${values['json'] === true ? JSON.stringify({ schemaVersion: 1, stages: results }, null, 2) : renderGateReport(results)}\n`,
    )
    return gateExitCode(results)
  } catch (error) {
    io.stderr(`configuration error: ${(error as Error).message}\n`)
    return error instanceof ConfigError
      ? ExitCode.CONFIGURATION
      : ExitCode.INFRASTRUCTURE
  }
}
```

- [ ] **Step 4: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/gate tests/commands && pnpm --filter @syntopica/db-quality lint`
Expected: PASS.

```bash
git add packages/db-quality/src/gate packages/db-quality/src/commands/gateCommand.ts packages/db-quality/tests/gate packages/db-quality/tests/commands/gateCommand.test.ts
git commit -m "feat(db-quality): gate running check or baseline-check and the linked audit"
```

---

### Task 15: `init`

**Files:**

- Create: `assets/db-quality.yml`, `src/init/PlanDisposition.ts`,
  `src/init/ManagedFile.ts`, `src/init/planConfigFile.ts`,
  `src/init/planPackageScript.ts`, `src/init/planWorkflow.ts`,
  `src/init/planInit.ts`, `src/init/applyInit.ts`, `src/init/renderInitPlan.ts`,
  `src/commands/initCommand.ts`
- Test: `tests/init/planConfigFile.test.ts`,
  `tests/init/planPackageScript.test.ts`, `tests/init/planWorkflow.test.ts`,
  `tests/init/applyInit.test.ts`, `tests/commands/initCommand.test.ts`

**Interfaces:**

- Consumes: `detectStacks`, `CONFIG_FILENAME`, `validateConfigDocument`,
  `assetPath`, `ExitCode`, `ConfigError`, `parseCommandArgs`.
- Produces:
  - `type PlanDisposition = 'create' | 'merge' | 'conflict' | 'unchanged'`
  - `type ManagedFile = { path: string; disposition: PlanDisposition; detail: string; content?: string }`
    — `path` relative to root; `content` is the full text to write for `create`
    and `merge`
  - `planConfigFile(root, force): ManagedFile` — `create` with
    `{ "schemaVersion": 1, ...detectStacks(root) }` pretty-printed; `unchanged`
    when the existing file parses and validates; `conflict` when it exists but
    does not validate (or `merge` with the fresh content when `force`)
  - `planPackageScript(root, force): ManagedFile` — for `package.json`: `merge`
    adding `"db:gate": "codeality-db gate"` to `scripts` (keeping key order,
    appending); `unchanged` when present with that value; `conflict` when
    present with another value (or `merge` overwriting when `force`);
    `unchanged` with detail `no package.json` when the file is absent
  - `planWorkflow(root, force): ManagedFile` — for
    `.github/workflows/db-quality.yml`: `create` from `assets/db-quality.yml`;
    `unchanged` when byte-identical; `conflict` otherwise (or `merge` when
    `force`)
  - `planInit(root, force): ManagedFile[]` — the three above in that order
  - `applyInit(root, plan): void` — writes `create` and `merge` entries
    (creating parent directories)
  - `renderInitPlan(plan): string` — one line per file:
    `<disposition padded to 9>  <path>  <detail>`
  - `initCommand(argv, io): number` — options `--check`, `--apply`, `--force`;
    default prints the plan and exits 0; `--check` exits 1 when any disposition
    is not `unchanged`; `--apply` writes and exits 0, but exits 2 without
    writing when any `conflict` remains; `--force` implies `--apply`

- [ ] **Step 1: Write the workflow asset**

`assets/db-quality.yml`:

```yaml
name: Database quality

on:
  push:
    branches: [main]
  pull_request:

jobs:
  db-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6
      - uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      # The linked audit needs the account that owns the project. Without a
      # token the gate reports failed-to-run on purpose; set audit.inGate to
      # false in codeality-db.json to run the static stages only.
      - run: pnpm exec codeality-db gate
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

- [ ] **Step 2: Write the failing tests**

`tests/init/planConfigFile.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { planConfigFile } from '@/init/planConfigFile.js'

describe('planConfigFile', () => {
  it('creates the file from the detected stacks', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    const plan = planConfigFile(root, false)
    expect(plan.disposition).toBe('create')
    expect(JSON.parse(plan.content ?? '')).toEqual({
      schemaVersion: 1,
      supabase: { migrations: 'supabase/migrations' },
    })
  })
  it('leaves a valid file alone and flags an invalid one', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":1}')
    expect(planConfigFile(root, false).disposition).toBe('unchanged')
    writeFileSync(join(root, 'codeality-db.json'), '{"schemaVersion":9}')
    expect(planConfigFile(root, false).disposition).toBe('conflict')
    expect(planConfigFile(root, true).disposition).toBe('merge')
  })
})
```

`tests/init/planPackageScript.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { planPackageScript } from '@/init/planPackageScript.js'

describe('planPackageScript', () => {
  it('appends the script, keeps the others, detects the three states', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    writeFileSync(
      join(root, 'package.json'),
      '{\n  "name": "x",\n  "scripts": {\n    "test": "vitest"\n  }\n}\n',
    )
    const plan = planPackageScript(root, false)
    expect(plan.disposition).toBe('merge')
    expect(JSON.parse(plan.content ?? '').scripts).toEqual({
      test: 'vitest',
      'db:gate': 'codeality-db gate',
    })
    writeFileSync(join(root, 'package.json'), plan.content ?? '')
    expect(planPackageScript(root, false).disposition).toBe('unchanged')
    writeFileSync(
      join(root, 'package.json'),
      '{"scripts":{"db:gate":"something else"}}',
    )
    expect(planPackageScript(root, false).disposition).toBe('conflict')
    expect(planPackageScript(root, true).disposition).toBe('merge')
  })
  it('is unchanged without a package.json', () => {
    expect(
      planPackageScript(mkdtempSync(join(tmpdir(), 'dbq-')), false),
    ).toMatchObject({ disposition: 'unchanged', detail: 'no package.json' })
  })
})
```

`tests/init/planWorkflow.test.ts`:

```ts
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { planWorkflow } from '@/init/planWorkflow.js'

describe('planWorkflow', () => {
  it('creates, then is unchanged, then conflicts on a local edit', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    const plan = planWorkflow(root, false)
    expect(plan).toMatchObject({
      disposition: 'create',
      path: '.github/workflows/db-quality.yml',
    })
    mkdirSync(join(root, '.github/workflows'), { recursive: true })
    writeFileSync(
      join(root, '.github/workflows/db-quality.yml'),
      plan.content ?? '',
    )
    expect(planWorkflow(root, false).disposition).toBe('unchanged')
    writeFileSync(
      join(root, '.github/workflows/db-quality.yml'),
      'name: edited\n',
    )
    expect(planWorkflow(root, false).disposition).toBe('conflict')
    expect(planWorkflow(root, true).disposition).toBe('merge')
  })
})
```

`tests/init/applyInit.test.ts`:

```ts
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { applyInit } from '@/init/applyInit.js'
import { planInit } from '@/init/planInit.js'

describe('applyInit', () => {
  it('writes only create and merge entries', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    applyInit(root, planInit(root, false))
    expect(readFileSync(join(root, 'codeality-db.json'), 'utf8')).toContain(
      '"schemaVersion": 1',
    )
    expect(existsSync(join(root, '.github/workflows/db-quality.yml'))).toBe(
      true,
    )
    expect(existsSync(join(root, 'package.json'))).toBe(false)
    expect(
      planInit(root, false).every((file) => file.disposition === 'unchanged'),
    ).toBe(true)
  })
})
```

`tests/commands/initCommand.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { initCommand } from '@/commands/initCommand.js'

const io = (root: string) => {
  const out: string[] = []
  return {
    root,
    runner: () => ({ status: 0, stdout: '', stderr: '', missing: false }),
    stdout: (s: string) => out.push(s),
    stderr: (s: string) => out.push(s),
    out,
  }
}

describe('initCommand', () => {
  it('plans by default, --check fails while work remains, --apply writes', () => {
    const context = io(mkdtempSync(join(tmpdir(), 'dbq-')))
    expect(initCommand([], context)).toBe(0)
    expect(context.out.join('')).toMatch(/create\s+codeality-db.json/)
    expect(initCommand(['--check'], context)).toBe(1)
    expect(initCommand(['--apply'], context)).toBe(0)
    expect(initCommand(['--check'], context)).toBe(0)
  })
  it('refuses to apply over a conflict without --force', () => {
    const context = io(mkdtempSync(join(tmpdir(), 'dbq-')))
    writeFileSync(
      join(context.root, 'codeality-db.json'),
      '{"schemaVersion":9}',
    )
    expect(initCommand(['--apply'], context)).toBe(2)
    expect(initCommand(['--force'], context)).toBe(0)
  })
})
```

- [ ] **Step 3: Run the tests to see them fail**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/init tests/commands/initCommand.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

`src/init/PlanDisposition.ts`:

```ts
/** The four outcomes init reports for a managed file. */
export type PlanDisposition = 'create' | 'merge' | 'conflict' | 'unchanged'
```

`src/init/ManagedFile.ts`:

```ts
import type { PlanDisposition } from '@/init/PlanDisposition.js'

export type ManagedFile = {
  path: string
  disposition: PlanDisposition
  detail: string
  content?: string
}
```

`src/init/planConfigFile.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import { detectStacks } from '@/config/detectStacks.js'
import { validateConfigDocument } from '@/config/validateConfigDocument.js'
import type { ManagedFile } from '@/init/ManagedFile.js'

export const planConfigFile = (root: string, force: boolean): ManagedFile => {
  const content = `${JSON.stringify({ schemaVersion: 1, ...detectStacks(root) }, null, 2)}\n`
  const path = join(root, CONFIG_FILENAME)
  if (!existsSync(path))
    return {
      path: CONFIG_FILENAME,
      disposition: 'create',
      detail: 'from the detected stacks',
      content,
    }
  try {
    validateConfigDocument(JSON.parse(readFileSync(path, 'utf8')))
    return { path: CONFIG_FILENAME, disposition: 'unchanged', detail: 'valid' }
  } catch (error) {
    return force
      ? {
          path: CONFIG_FILENAME,
          disposition: 'merge',
          detail: 'replaced (--force)',
          content,
        }
      : {
          path: CONFIG_FILENAME,
          disposition: 'conflict',
          detail: (error as Error).message,
        }
  }
}
```

`src/init/planPackageScript.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { ManagedFile } from '@/init/ManagedFile.js'

export const planPackageScript = (
  root: string,
  force: boolean,
): ManagedFile => {
  const path = join(root, 'package.json')
  if (!existsSync(path))
    return {
      path: 'package.json',
      disposition: 'unchanged',
      detail: 'no package.json',
    }
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
    scripts?: Record<string, string>
  }
  const current = manifest.scripts?.['db:gate']
  if (current === 'codeality-db gate')
    return {
      path: 'package.json',
      disposition: 'unchanged',
      detail: 'db:gate present',
    }
  if (current !== undefined && !force)
    return {
      path: 'package.json',
      disposition: 'conflict',
      detail: `db:gate is "${current}"`,
    }
  const content = `${JSON.stringify({ ...manifest, scripts: { ...manifest.scripts, 'db:gate': 'codeality-db gate' } }, null, 2)}\n`
  return {
    path: 'package.json',
    disposition: 'merge',
    detail: 'add scripts.db:gate',
    content,
  }
}
```

`src/init/planWorkflow.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { assetPath } from '@/assetPath.js'
import type { ManagedFile } from '@/init/ManagedFile.js'

export const planWorkflow = (root: string, force: boolean): ManagedFile => {
  const relative = '.github/workflows/db-quality.yml'
  const content = readFileSync(assetPath('db-quality.yml'), 'utf8')
  const path = join(root, relative)
  if (!existsSync(path))
    return {
      path: relative,
      disposition: 'create',
      detail: 'runs codeality-db gate on push and pull request',
      content,
    }
  if (readFileSync(path, 'utf8') === content)
    return { path: relative, disposition: 'unchanged', detail: 'identical' }
  return force
    ? {
        path: relative,
        disposition: 'merge',
        detail: 'replaced (--force)',
        content,
      }
    : {
        path: relative,
        disposition: 'conflict',
        detail: 'differs from the shipped workflow',
      }
}
```

`src/init/planInit.ts`:

```ts
import type { ManagedFile } from '@/init/ManagedFile.js'
import { planConfigFile } from '@/init/planConfigFile.js'
import { planPackageScript } from '@/init/planPackageScript.js'
import { planWorkflow } from '@/init/planWorkflow.js'

export const planInit = (root: string, force: boolean): ManagedFile[] => [
  planConfigFile(root, force),
  planPackageScript(root, force),
  planWorkflow(root, force),
]
```

`src/init/applyInit.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { ManagedFile } from '@/init/ManagedFile.js'

export const applyInit = (root: string, plan: ManagedFile[]): void => {
  for (const file of plan) {
    if (
      (file.disposition !== 'create' && file.disposition !== 'merge') ||
      file.content === undefined
    )
      continue
    mkdirSync(dirname(join(root, file.path)), { recursive: true })
    writeFileSync(join(root, file.path), file.content)
  }
}
```

`src/init/renderInitPlan.ts`:

```ts
import type { ManagedFile } from '@/init/ManagedFile.js'

export const renderInitPlan = (plan: ManagedFile[]): string =>
  plan
    .map(
      (file) => `${file.disposition.padEnd(9)}  ${file.path}  ${file.detail}`,
    )
    .join('\n')
```

`src/commands/initCommand.ts`:

```ts
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { ConfigError } from '@/config/ConfigError.js'
import { applyInit } from '@/init/applyInit.js'
import { planInit } from '@/init/planInit.js'
import { renderInitPlan } from '@/init/renderInitPlan.js'
import { ExitCode } from '@/model/ExitCode.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const initCommand = (
  argv: string[],
  io: {
    root: string
    runner: CommandRunner
    stdout: (s: string) => void
    stderr: (s: string) => void
  },
): number => {
  try {
    const { values } = parseCommandArgs(argv, {
      check: { type: 'boolean' },
      apply: { type: 'boolean' },
      force: { type: 'boolean' },
    })
    const force = values['force'] === true
    const plan = planInit(io.root, force)
    io.stdout(`${renderInitPlan(plan)}\n`)
    if (values['check'] === true)
      return plan.every((file) => file.disposition === 'unchanged')
        ? ExitCode.OK
        : ExitCode.FINDINGS
    if (values['apply'] !== true && !force) return ExitCode.OK
    if (plan.some((file) => file.disposition === 'conflict'))
      throw new ConfigError('conflicts remain; resolve them or pass --force')
    applyInit(io.root, plan)
    return ExitCode.OK
  } catch (error) {
    io.stderr(
      `${error instanceof ConfigError ? 'configuration error' : 'error'}: ${(error as Error).message}\n`,
    )
    return error instanceof ConfigError
      ? ExitCode.CONFIGURATION
      : ExitCode.INFRASTRUCTURE
  }
}
```

- [ ] **Step 5: Run the tests, lint, commit**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/init tests/commands && pnpm --filter @syntopica/db-quality lint`
Expected: PASS.

```bash
git add packages/db-quality/assets/db-quality.yml packages/db-quality/src/init packages/db-quality/src/commands/initCommand.ts packages/db-quality/tests/init packages/db-quality/tests/commands/initCommand.test.ts
git commit -m "feat(db-quality): init writes the configuration, the script and the workflow without overwriting"
```

---

### Task 16: CLI entry, README, full package checks

**Files:**

- Modify: `src/cli.ts`, `README.md`, `CHANGELOG.md`
- Test: `tests/cli.integration.test.ts` (runs the built bin)

**Interfaces:**

- Consumes: every `*Command`, `spawnRunner`, `PACKAGE_VERSION`, `ExitCode`.
- Produces: `codeality-db <init|check|audit|gate|baseline> [options]`,
  `--version`, `--help`; `--project <dir>` accepted before the command name to
  run against another directory (default `process.cwd()`).

- [ ] **Step 1: Write the failing integration test**

`tests/cli.integration.test.ts`:

```ts
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeAll, describe, expect, it } from 'vitest'

const bin = new URL('../bin/codeality-db.mjs', import.meta.url).pathname
const run = (args: string[], cwd: string) =>
  spawnSync('node', [bin, ...args], { cwd, encoding: 'utf8' })

describe('codeality-db', () => {
  beforeAll(() => {
    execFileSync('pnpm', ['build'], {
      cwd: new URL('..', import.meta.url).pathname,
      stdio: 'ignore',
    })
  })
  it('prints the version and the usage', () => {
    expect(run(['--version'], tmpdir()).stdout).toMatch(
      /^codeality-db \d+\.\d+\.\d+\n$/,
    )
    const help = run(['--help'], tmpdir())
    expect(help.status).toBe(0)
    expect(help.stdout).toMatch(/init.*check.*audit.*gate.*baseline/s)
    expect(run([], tmpdir()).status).toBe(2)
  })
  it('runs init then check on a fresh project with a permissive policy', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    writeFileSync(
      join(root, 'supabase/migrations/1.sql'),
      'create table public.t (id bigint primary key);\nalter table public.t enable row level security;\ncreate policy "p" on public.t for select using (true);',
    )
    expect(run(['init', '--apply'], root).status).toBe(0)
    const check = run(['--project', root, 'check'], tmpdir())
    expect(check.status).toBe(1)
    expect(check.stdout).toMatch(/BDB001/)
  })
})
```

- [ ] **Step 2: Run the test to see it fail**

Run:
`pnpm --filter @syntopica/db-quality exec vitest run tests/cli.integration.test.ts`
Expected: FAIL (`--help` and commands are not wired).

- [ ] **Step 3: Implement the entry**

`src/cli.ts`:

```ts
import { argv, cwd, exit, stderr, stdout } from 'node:process'

import { auditCommand } from '@/commands/auditCommand.js'
import { baselineCommand } from '@/commands/baselineCommand.js'
import { checkCommand } from '@/commands/checkCommand.js'
import { gateCommand } from '@/commands/gateCommand.js'
import { initCommand } from '@/commands/initCommand.js'
import { ExitCode } from '@/model/ExitCode.js'
import { PACKAGE_VERSION } from '@/packageVersion.js'
import { spawnRunner } from '@/tools/spawnRunner.js'

const USAGE = `usage: codeality-db [--project <dir>] <command> [options]

  init      [--check|--apply|--force]   detect stacks, write codeality-db.json, the db:gate script and the CI workflow
  check     [--json]                    static findings from the repository alone
  audit     --linked|--db-url <url> [--json]   findings from the live database
  gate      [--json]                    check (or baseline check) and the linked audit, one exit code
  baseline  create|update|check [--check-stale]   record, refresh or enforce the debt the project carries

exit codes: 0 passed, 1 findings, 2 invalid usage or configuration, 3 required tool missing or unusable
`

const args = argv.slice(2)
if (args.includes('--version')) {
  stdout.write(`codeality-db ${PACKAGE_VERSION}\n`)
  exit(ExitCode.OK)
}
if (args.includes('--help') || args.includes('-h')) {
  stdout.write(USAGE)
  exit(ExitCode.OK)
}
let root = cwd()
if (args[0] === '--project') {
  root = args[1] ?? ''
  args.splice(0, 2)
}
const [command, ...rest] = args
const io = {
  root,
  runner: spawnRunner,
  stdout: (s: string) => stdout.write(s),
  stderr: (s: string) => stderr.write(s),
}
const commands: Record<string, (argv: string[], io: typeof io) => number> = {
  init: initCommand,
  check: checkCommand,
  audit: auditCommand,
  gate: gateCommand,
  baseline: baselineCommand,
}
const handler = command === undefined ? undefined : commands[command]
if (!handler) {
  stderr.write(USAGE)
  exit(ExitCode.CONFIGURATION)
}
exit(handler(rest, io))
```

(`cli.ts` is an entry point: the house `one-primary-unit` rule exempts nothing
named `cli.ts`, so add
`{ files: ['src/cli.ts'], rules: { 'code-policy/one-primary-unit': 'off', 'code-policy/no-hidden-top-level-declarations': 'off' } }`
to `eslint.config.ts`, the same exemption `codeality-py` gives its `cli.py`
through the `entrypoint` role.)

- [ ] **Step 4: Write the README**

`README.md`:

````markdown
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

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| 0    | All blocking checks passed.                                     |
| 1    | Findings.                                                       |
| 2    | Invalid usage or invalid configuration.                         |
| 3    | Infrastructure failure: a required tool is missing or unusable. |

## License

MIT
````

- [ ] **Step 5: Run the whole package and the monorepo gates**

Run:

```bash
pnpm --filter @syntopica/db-quality build
pnpm --filter @syntopica/db-quality test
pnpm --filter @syntopica/db-quality lint
pnpm --filter @syntopica/db-quality type-check
pnpm --filter @syntopica/db-quality publish:check
pnpm check:ci
pnpm knip
pnpm dupes
```

Expected: every command exits 0; coverage thresholds met; `publint --strict`
clean. If knip reports the peer tools as unused devDependencies, add them to
`packages/db-quality`'s entry in the root `knip.config.ts` `ignoreDependencies`
with a comment naming the adapter that spawns each one, the same way the root
already ignores `jscpd` and `type-coverage`.

- [ ] **Step 6: Commit**

```bash
pnpm exec prettier --write packages/db-quality knip.config.ts
git add packages/db-quality knip.config.ts
git commit -m "feat(db-quality): command line entry and README"
```

---

### Task 17: Validation on the real projects (the owner's condition)

This is the task the spec makes a condition of "done": every adapter runs
against the repositories that exercise it, and every divergence becomes a
fixture, a rule change, or a documented exclusion. Nothing in the other
repositories is committed by this task; it only reads them and changes
`packages/db-quality`.

**Files:**

- Create: `packages/db-quality/docs/validation-2026-09.md` (the table below,
  filled in)
- Modify: whatever the divergences require under `packages/db-quality/src` and
  `tests`

- [ ] **Step 1: Link the built package where it can see the peers**

The peers are devDependencies of the package, so run the bin from the monorepo
with `--project`:

```bash
pnpm --filter @syntopica/db-quality build
alias dbq='node ~/p/codeality/packages/db-quality/bin/codeality-db.mjs'
```

For repositories that hold their own `squawk-cli`, `prisma-lint` or ESLint, the
runner's PATH prefix picks those up first; for the rest, the monorepo's
`node_modules/.bin` is not on the path, so export it once:
`export PATH="$HOME/p/codeality/node_modules/.bin:$PATH"`.

- [ ] **Step 2: Supabase static, six repositories**

For each of `verticagtm`, `pxpn`, `opus-origin`, `10xjoy`, `casegpt`,
`Mains.World`:

```bash
r=~/p/<repo>; dbq --project "$r" init; dbq --project "$r" init --apply; dbq --project "$r" check --json > /tmp/dbq-<repo>.json; echo "exit $?"
python3 -c 'import json,collections,sys; d=json.load(open(sys.argv[1])); c=collections.Counter(f["code"] for f in d["findings"]); [print(f"{v:5} {k}") for k,v in c.most_common()]' /tmp/dbq-<repo>.json
```

Expected, from the 2026-09-25 measurements: `BDB100/prefer-bigint-over-int` in
the fifties for `verticagtm`, `10xjoy` and `pxpn`; `BDB001` 17 in `verticagtm`,
12 in `casegpt`, 11 in `10xjoy`; `BDB002` 8 in `Mains.World`; no
`BDB100/require-lock-timeout` anywhere. Then, for each repository,
`git -C "$r" status --short` must show only `codeality-db.json`, `package.json`
and `.github/workflows/db-quality.yml`; revert them with
`git -C "$r" checkout -- . && git -C "$r" clean -f codeality-db.json .github/workflows/db-quality.yml`
unless the owner asks to keep them.

Divergences to look for and what to do:

- A statement the splitter cuts wrongly (a `BDB00x` finding at a line that is
  not a statement start, or a rule that misses a policy visible with grep): add
  the exact SQL as a fixture under `tests/fixtures/migrations/` and fix
  `splitSqlStatements` or the rule.
- `BDB003` on a table that a later migration renames or drops: record it as a
  known limitation in the validation document; the baseline carries it.
- `BDB004` on `auth.uid()` inside a function body called from the policy: not a
  finding of this rule; if it fires, the `create policy` prefix check is wrong.
- Squawk `file` paths that do not match `MigrationFile.path` (Windows separators
  or `./` prefixes): normalise in `parseSquawkReport` and add a test.

- [ ] **Step 3: Prisma, Drizzle, SQLite**

```bash
for r in contratica dameticket-nextjs; do dbq --project ~/p/$r init --apply && dbq --project ~/p/$r check; done
for r in tieneslavibra contratos vexa-insight; do dbq --project ~/p/$r init --apply && dbq --project ~/p/$r check; done
for r in jobradar vexa-insight inbox-companion; do dbq --project ~/p/$r check; done
```

Expected: `contratica` 1 `BDB200/require-field-index` (`updatedBy`),
`dameticket-nextjs` 0; the Drizzle repositories 0 `BDB300` findings and exit 0
(an exit 3 there means ESLint could not load the shipped config: check that
`eslint-plugin-drizzle` and `typescript-eslint` resolve from the monorepo's
`node_modules`); the SQLite files report 0 findings. `vexa-insight` runs Drizzle
and SQLite in one `check`. Revert the init files as in Step 2.

- [ ] **Step 4: Audit and gate on the linked project**

```bash
dbq --project ~/p/verticagtm audit --linked --json > /tmp/dbq-verticagtm-audit.json; echo "exit $?"
python3 -c 'import json,collections; d=json.load(open("/tmp/dbq-verticagtm-audit.json")); c=collections.Counter((f["severity"],f["code"]) for f in d["findings"]); [print(f"{v:5} {k[0]:5} {k[1]}") for k,v in c.most_common()]'
dbq --project ~/p/verticagtm gate; echo "exit $?"
```

Expected: exit 1 with one `error` `BDB500/security_definer_view`, 36
`BDB500/multiple_permissive_policies`, 30
`BDB500/authenticated_security_definer_function_executable`, 15
`BDB500/function_search_path_mutable`, 6 `BDB500/auth_rls_initplan`, 4
`BDB500/anon_security_definer_function_executable`, plus `BDB601` for
`public.usage_events_org_created_idx` only if its scan count is still 0 (on
2026-09-25 it was 25711, so expect no `BDB601`), and no `BDB602` (bloat peaks at
3.8). The gate prints `findings` for both stages and exits 1. Then, on `10xjoy`:

```bash
dbq --project ~/p/10xjoy audit --linked; echo "exit $?"
```

Expected: exit 3 and a message containing `403`. That is the account boundary
the spec describes, not a bug.

- [ ] **Step 5: Soda against a local Postgres**

```bash
mkdir -p /tmp/dbq-soda/db-quality/soda && cat > /tmp/dbq-soda/db-quality/soda/checks.yml <<'EOF'
checks for _prisma_migrations:
  - row_count > 0
  - duplicate_count(id) = 0
EOF
echo '{"schemaVersion":1,"audit":{"soda":"db-quality/soda"}}' > /tmp/dbq-soda/codeality-db.json
dbq --project /tmp/dbq-soda audit --db-url "postgresql://$USER@localhost:5432/taxhacker"; echo "exit $?"
```

Expected: advisors and inspect fail against a plain Postgres because
`supabase db advisors --db-url` needs a Supabase project; if that is what
happens, split `runAudit` so that Soda runs first and the Supabase adapters are
skipped with `'not-applicable'` when `--db-url` does not point at a Supabase
host (`*.supabase.co` or `*.pooler.supabase.com`). Record the decision in the
validation document and add a test for the host check. With that change, expect
`3/3 checks PASSED` semantics: exit 0 and no `BDB700` findings.

- [ ] **Step 6: Baseline on verticagtm**

```bash
dbq --project ~/p/verticagtm baseline create && dbq --project ~/p/verticagtm gate; echo "exit $?"
```

Expected: the check stage becomes `baseline-check` and passes; the gate exit is
1 from the audit findings only. Remove
`~/p/verticagtm/.codeality-db-baseline.json` afterwards unless the owner asks to
keep it.

- [ ] **Step 7: Write the validation document and commit**

`packages/db-quality/docs/validation-2026-09.md` holds one table per adapter:
repository, command, exit code, finding counts by code, divergence found, what
changed in the package. Every divergence fixed in Steps 2-6 has its test
committed in the same change.

```bash
pnpm --filter @syntopica/db-quality test && pnpm check:ci
git add packages/db-quality
git commit -m "test(db-quality): validation against the estate's repositories"
```

- [ ] **Step 8: Hand the adoption decision back**

Report to the owner: the counts per repository, the divergences and how they
were resolved, and the two adoption steps that touch other repositories and are
theirs to approve: committing `codeality-db.json`, `db:gate` and the workflow in
`verticagtm` with a `baseline create`, and publishing `@syntopica/db-quality`
0.1.0 via `gh workflow run publish.yml -f package=db-quality` (after registering
the trusted publisher on npmjs.com for the new package name, which only the
owner can do).

---

## Self-review

**Spec coverage.** Shape and distribution: Task 1. Configuration file and keys:
Task 3. Commands and exit codes: Tasks 11-16. Finding model and code families:
Task 2 and the Global Constraints. `check` adapters: Tasks 4-5 (own rules), 7
(squawk), 8 (Prisma), 9 (Drizzle), 10 (SQLite). `audit`: Task 13, including the
401/403 handling and the Soda shim. `gate`: Task 14. Baseline: Task 12. `init`:
Task 15. Dependencies: Task 1's `package.json`. Testing: every task; the
saved-JSON parsers in Tasks 7 and 13; guarded integration tests in Tasks 7-10.
Validation on the real projects: Task 17. Out of scope items are not planned.

**Deviations from the spec, on purpose.** Code families are `BDB100/...` rather
than the spec's `BDB1xx/...` placeholder. `BDB601` and `BDB602` use
`index-stats` and `bloat` only; `outliers` is not surfaced at all rather than
"printed as a report", because the command output is findings and a report line
with a `pg_sleep` on top would mislead. The spec's `audit.soda` runs only with
`--db-url`, which the spec implies but does not state.

**Type consistency.** `Finding` fields
(`code, severity, path, line, message, subject, fingerprint`) are used
identically in every adapter. `CommandRunner` returns `CommandResult`
everywhere. `CheckContext` is `{ root, config, runner }` in `runCheck`,
`gateStages` and the commands; `runAudit` takes that plus `target`. Command
handlers share the signature
`(argv: string[], io: { root; runner; stdout; stderr }) => number`, which is
what `cli.ts` dispatches to.
