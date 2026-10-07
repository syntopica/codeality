import type { DialectCompilation } from '@/adapters/kysely/DialectCompilation.js'
import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'

/** A compiled migration for rule tests: each dialect's up given as plain SQL strings. */
export const locatedFixture = (
  name: string,
  up: Partial<Record<KyselyDialect, string[]>>,
  extra: Partial<LocatedMigration> = {},
): LocatedMigration => ({
  name,
  path: 'src/migrations.ts',
  line: 3,
  hasDown: true,
  dialects: Object.fromEntries(
    Object.entries(up).map(
      ([dialect, statements]): [string, DialectCompilation] => [
        dialect,
        { up: statements.map((sql) => ({ sql, parameters: [] })), down: [] },
      ],
    ),
  ),
  ...extra,
})
