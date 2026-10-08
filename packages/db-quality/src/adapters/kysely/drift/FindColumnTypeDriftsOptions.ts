import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { DriftTypeScript } from '@/adapters/kysely/drift/DriftTypeScript.js'
import type { LiveSchema } from '@/adapters/kysely/drift/LiveSchema.js'
import type ts from 'typescript'

/** Parameters for comparing the shared columns' live and declared types. */
export type FindColumnTypeDriftsOptions = {
  ts: DriftTypeScript
  probe: string
  scratch: string
  live: LiveSchema
  declared: DeclaredSchema
  baseOptions: ts.CompilerOptions
}
