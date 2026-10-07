import { KYSELY_SQUAWK_EXCLUDES } from '@/adapters/squawk/KYSELY_SQUAWK_EXCLUDES.js'
import { PORTABLE_SCHEMA_SQUAWK_EXCLUDES } from '@/adapters/squawk/PORTABLE_SCHEMA_SQUAWK_EXCLUDES.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'

/** squawk's excludes for Kysely migrations: the PostgreSQL-only type advice too when more than one dialect is configured. */
export const kyselySquawkExcludes = (dialects: KyselyDialect[]): string[] =>
  dialects.length > 1
    ? [...KYSELY_SQUAWK_EXCLUDES, ...PORTABLE_SCHEMA_SQUAWK_EXCLUDES]
    : KYSELY_SQUAWK_EXCLUDES
