import { expectConfig } from '@/config/expectConfig.js'
import { isPositiveInteger } from '@/config/isPositiveInteger.js'
import { isStringList } from '@/config/isStringList.js'
import { SQLITE_QUERY_MIN_ROWS } from '@/config/SQLITE_QUERY_MIN_ROWS.js'
import type { SqliteQueriesConfig } from '@/config/SqliteQueriesConfig.js'

export const sqliteQueriesSectionFrom = (
  raw: Record<string, unknown>,
): SqliteQueriesConfig => {
  const paths = raw['paths']
  const database = raw['database']
  const minRows = raw['minRows'] ?? SQLITE_QUERY_MIN_ROWS
  expectConfig(
    isStringList(paths),
    'sqlite.queries.paths must be a list of strings',
  )
  expectConfig(
    (paths as string[]).length > 0,
    'sqlite.queries.paths must name at least one directory',
  )
  expectConfig(
    database === undefined || typeof database === 'string',
    'sqlite.queries.database must be a string',
  )
  expectConfig(
    isPositiveInteger(minRows),
    'sqlite.queries.minRows must be a positive integer',
  )
  return {
    paths: paths as string[],
    ...(database === undefined ? {} : { database: database as string }),
    minRows: minRows as number,
  }
}
