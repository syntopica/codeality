import { kyselyDialectsFrom } from '@/config/kyselyDialectsFrom.js'
import type { KyselyMigrationsConfig } from '@/config/KyselyMigrationsConfig.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

export const kyselyMigrationsSectionFrom = (
  raw: Record<string, unknown>,
): KyselyMigrationsConfig => {
  const { module, folder } = raw
  const exportName = raw['export'] ?? 'migrations'
  const moneyColumns = raw['moneyColumns'] ?? false
  if ((typeof module === 'string') === (typeof folder === 'string'))
    throw new ConfigError(
      'kysely.migrations needs exactly one of "module" or "folder", as a string',
    )
  if (typeof exportName !== 'string')
    throw new ConfigError('kysely.migrations.export must be a string')
  if (typeof moneyColumns !== 'boolean')
    throw new ConfigError('kysely.migrations.moneyColumns must be a boolean')
  const dialects = kyselyDialectsFrom(raw['dialects'])
  return {
    ...(typeof module === 'string' ? { module } : {}),
    ...(typeof folder === 'string' ? { folder } : {}),
    export: exportName,
    ...(dialects === undefined ? {} : { dialects }),
    moneyColumns,
  }
}
