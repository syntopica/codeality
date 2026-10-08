import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { DriftProgram } from '@/adapters/kysely/drift/DriftProgram.js'
import type { LiveSchema } from '@/adapters/kysely/drift/LiveSchema.js'

/** The live and declared schemas read off the probe program, plus the program itself for reuse. */
export type DriftSchemas = {
  live: LiveSchema
  declared: DeclaredSchema
  program: DriftProgram
}
