import type { KyselyStatement } from '@/adapters/kysely/KyselyStatement.js'

/** What one migration compiled to on one dialect; `error` when its up or down threw. */
export type DialectCompilation = {
  up: KyselyStatement[]
  down: KyselyStatement[]
  error?: string
}
