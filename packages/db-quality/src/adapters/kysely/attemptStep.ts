import type { Kysely } from 'kysely'

import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'
import type { MigrationStep } from '@/adapters/kysely/MigrationStep.js'
import type { StepOutcome } from '@/adapters/kysely/StepOutcome.js'

/** Runs one step against the capturing instance; a throw is recorded, not raised. */
export const attemptStep = async (
  step: MigrationStep | undefined,
  db: Kysely<unknown>,
  sink: KyselyStatement[],
): Promise<StepOutcome> => {
  sink.length = 0
  if (!step) return { statements: [] }
  try {
    await step(db)
    return { statements: [...sink] }
  } catch (error) {
    return {
      statements: [...sink],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
