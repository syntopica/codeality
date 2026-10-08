import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { LiveSchema } from '@/adapters/kysely/drift/LiveSchema.js'

/** Parameters for writing the second (check) probe. */
export type WriteDriftCheckProbeOptions = {
  scratch: string
  live: LiveSchema
  declared: DeclaredSchema
}
