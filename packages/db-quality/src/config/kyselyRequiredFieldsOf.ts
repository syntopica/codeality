import { isStringList } from '@/config/isStringList.js'
import type { KyselyRequiredFields } from '@/config/KyselyRequiredFields.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

// Validates and extracts the always-required fields of the kysely config
// section.
export const kyselyRequiredFieldsOf = (
  kysely: Record<string, unknown>,
): KyselyRequiredFields => {
  const roots = kysely['roots']
  const objectNames = kysely['objectNames'] ?? ['db', 'trx']
  if (!isStringList(roots))
    throw new ConfigError('kysely.roots must be a list of strings')
  if (!isStringList(objectNames))
    throw new ConfigError('kysely.objectNames must be a list of strings')
  return { roots, objectNames }
}
