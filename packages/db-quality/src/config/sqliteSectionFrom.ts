import { ConfigError } from '@/config/ConfigError.js'
import { isStringList } from '@/config/isStringList.js'
import type { SqliteConfig } from '@/config/SqliteConfig.js'
import { sqliteQueriesSectionFrom } from '@/config/sqliteQueriesSectionFrom.js'

export const sqliteSectionFrom = (
  raw: Record<string, unknown>,
): SqliteConfig => {
  const files = raw['files']
  if (!isStringList(files))
    throw new ConfigError('sqlite.files must be a list of strings')
  const queries = raw['queries']
  if (queries === undefined) return { files }
  if (typeof queries !== 'object' || queries === null || Array.isArray(queries))
    throw new ConfigError('sqlite.queries must be an object')
  return {
    files,
    queries: sqliteQueriesSectionFrom(queries as Record<string, unknown>),
  }
}
