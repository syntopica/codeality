import type { KyselyDialect } from '@/config/KyselyDialect.js'

/** What the compiler process is asked to do, passed to it as one JSON argument. */
export type KyselyCompileRequest = {
  root: string
  module?: string
  folder?: string
  export: string
  dialects: KyselyDialect[]
}
