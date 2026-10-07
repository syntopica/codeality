import type { CompiledMigration } from '@/adapters/kysely/CompiledMigration.js'

/** A compiled migration and the line its name is declared on (0 when it is not in the file). */
export type LocatedMigration = CompiledMigration & { line: number }
