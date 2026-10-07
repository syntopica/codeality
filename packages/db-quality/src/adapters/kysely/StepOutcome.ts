import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'

/** The queries an `up` or `down` sent before it returned, and its error if it threw. */
export type StepOutcome = { statements: KyselyStatement[]; error?: string }
