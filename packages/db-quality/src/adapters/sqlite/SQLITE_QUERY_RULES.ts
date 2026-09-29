import { commaListMembership } from '@/adapters/sqlite/commaListMembership.js'
import { optionalParameterGuard } from '@/adapters/sqlite/optionalParameterGuard.js'
import type { SqlRule } from '@/rules/SqlRule.js'

/** Static rules on the query files of a SQLite project; no database needed. */
export const SQLITE_QUERY_RULES: SqlRule[] = [
  optionalParameterGuard,
  commaListMembership,
]
