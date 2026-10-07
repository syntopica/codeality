import type { KyselyDialect } from '@/config/KyselyDialect.js'

/** The driver package a Kysely dialect needs, and the dialect it implies when it is a dependency. */
export const KYSELY_DRIVER_DIALECTS: ReadonlyMap<string, KyselyDialect> =
  new Map([
    ['pg', 'postgres'],
    ['mysql2', 'mysql'],
    ['better-sqlite3', 'sqlite'],
  ])
