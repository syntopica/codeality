import type { KyselyDialect } from '@/config/KyselyDialect.js'

/**
 * Where the migrations live: `module` names a file whose named `export` is a
 * `Record<string, Migration>`, `folder` a directory of one migration per file.
 * Exactly one of the two is set. `dialects` absent means "infer from the
 * installed drivers" at check time.
 */
export type KyselyMigrationsConfig = {
  module?: string
  folder?: string
  export: string
  dialects?: KyselyDialect[]
  moneyColumns: boolean
}
