import { configSection } from '@/config/configSection.js'
import { isStringList } from '@/config/isStringList.js'
import type { KyselyConfig } from '@/config/KyselyConfig.js'
import { kyselyMigrationsSectionFrom } from '@/config/kyselyMigrationsSectionFrom.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

export const kyselySectionFrom = (
  kysely: Record<string, unknown>,
): KyselyConfig => {
  const roots = kysely['roots']
  const objectNames = kysely['objectNames'] ?? ['db', 'trx']
  const databaseType = kysely['databaseType']
  if (!isStringList(roots))
    throw new ConfigError('kysely.roots must be a list of strings')
  if (!isStringList(objectNames))
    throw new ConfigError('kysely.objectNames must be a list of strings')
  if (databaseType !== undefined && typeof databaseType !== 'string')
    throw new ConfigError('kysely.databaseType must be a string')
  const migrations = configSection(kysely, 'migrations')
  return {
    roots,
    objectNames,
    ...(migrations
      ? { migrations: kyselyMigrationsSectionFrom(migrations) }
      : {}),
    ...(databaseType === undefined ? {} : { databaseType }),
  }
}
