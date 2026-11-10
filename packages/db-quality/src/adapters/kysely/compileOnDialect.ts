import { attemptStep } from '@/adapters/kysely/attemptStep.js'
import { captureDialect } from '@/adapters/kysely/captureDialect.js'
import type { CompilingStep } from '@/adapters/kysely/CompilingStep.js'
import { declaredRows } from '@/adapters/kysely/declaredRows.js'
import type { DialectCompilation } from '@/adapters/kysely/DialectCompilation.js'
import type { KyselyModule } from '@/adapters/kysely/KyselyModule.js'
import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'
import type { LoadedMigration } from '@/adapters/kysely/LoadedMigration.js'
import type { StepOutcome } from '@/adapters/kysely/StepOutcome.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'
import type { KyselyQueryResponse } from '@/config/KyselyQueryResponse.js'

// Every up in order, then every down in reverse: the order a migrator would
// run them, for a migration that keeps state between the two.
/** Each migration's compiled up and down on one dialect, in the migrations' order. */
export const compileOnDialect = async (
  kysely: KyselyModule,
  migrations: LoadedMigration[],
  dialect: KyselyDialect,
  responses: readonly KyselyQueryResponse[] = [],
): Promise<DialectCompilation[]> => {
  const sink: KyselyStatement[] = []
  const current: CompilingStep = { migration: '', step: 'up' }
  const db = new kysely.Kysely<unknown>({
    dialect: captureDialect(kysely, dialect, sink, (sql) =>
      declaredRows(responses, current, sql),
    ),
  })
  const ups: StepOutcome[] = []
  for (const migration of migrations) {
    current.migration = migration.name
    current.step = 'up'
    ups.push(await attemptStep(migration.up, db, sink))
  }
  const downs: StepOutcome[] = []
  for (const migration of [...migrations].reverse()) {
    current.migration = migration.name
    current.step = 'down'
    downs.unshift(await attemptStep(migration.down, db, sink))
  }
  await db.destroy()
  return ups.map((up, index) => {
    const down = downs[index] ?? { statements: [] }
    const error =
      up.error === undefined
        ? down.error && `down: ${down.error}`
        : `up: ${up.error}`
    return {
      up: up.statements,
      down: down.statements,
      ...(error ? { error } : {}),
    }
  })
}
