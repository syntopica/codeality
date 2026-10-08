import { isStringList } from '@/config/isStringList.js'
import type { KyselyDatabaseTypeFields } from '@/config/KyselyDatabaseTypeFields.js'
import { kyselyDatabaseTypeRefFrom } from '@/config/kyselyDatabaseTypeRefFrom.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

// Validates and extracts the optional databaseType and databaseTypeIgnores
// fields of the kysely config section.
export const kyselyDatabaseTypeFieldsOf = (
  kysely: Record<string, unknown>,
): KyselyDatabaseTypeFields => {
  const databaseType = kysely['databaseType']
  const databaseTypeIgnores = kysely['databaseTypeIgnores']
  if (databaseType !== undefined && typeof databaseType !== 'string')
    throw new ConfigError('kysely.databaseType must be a string')
  if (databaseType !== undefined) kyselyDatabaseTypeRefFrom(databaseType)
  if (databaseTypeIgnores !== undefined && !isStringList(databaseTypeIgnores))
    throw new ConfigError(
      'kysely.databaseTypeIgnores must be a list of strings',
    )
  return {
    databaseType: databaseType,
    databaseTypeIgnores: databaseTypeIgnores,
  }
}
