import type { DialectCompilation } from '@/adapters/kysely/DialectCompilation.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'

/** One migration, root-relative `path` to where it is declared, compiled on each dialect asked for. */
export type CompiledMigration = {
  name: string
  path: string
  hasDown: boolean
  dialects: Partial<Record<KyselyDialect, DialectCompilation>>
}
