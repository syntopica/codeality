import { configSection } from '@/config/configSection.js'
import type { KyselyConfig } from '@/config/KyselyConfig.js'
import { kyselyDatabaseTypeFieldsOf } from '@/config/kyselyDatabaseTypeFieldsOf.js'
import { kyselyMigrationsSectionFrom } from '@/config/kyselyMigrationsSectionFrom.js'
import { kyselyRequiredFieldsOf } from '@/config/kyselyRequiredFieldsOf.js'

export const kyselySectionFrom = (
  kysely: Record<string, unknown>,
): KyselyConfig => {
  const { roots, objectNames } = kyselyRequiredFieldsOf(kysely)
  const { databaseType, databaseTypeIgnores } =
    kyselyDatabaseTypeFieldsOf(kysely)
  const migrations = configSection(kysely, 'migrations')
  return {
    roots,
    objectNames,
    ...(migrations
      ? { migrations: kyselyMigrationsSectionFrom(migrations) }
      : {}),
    ...(databaseType === undefined ? {} : { databaseType }),
    ...(databaseTypeIgnores === undefined ? {} : { databaseTypeIgnores }),
  }
}
