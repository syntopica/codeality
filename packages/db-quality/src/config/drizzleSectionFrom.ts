import { ConfigError } from '@/config/ConfigError.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { isStringList } from '@/config/isStringList.js'

export const drizzleSectionFrom = (
  drizzle: Record<string, unknown>,
): NonNullable<DbQualityConfig['drizzle']> => {
  const roots = drizzle['roots']
  const objectNames = drizzle['objectNames'] ?? ['db', 'tx']
  if (!isStringList(roots))
    throw new ConfigError('drizzle.roots must be a list of strings')
  if (!isStringList(objectNames)) {
    throw new ConfigError('drizzle.objectNames must be a list of strings')
  }
  return { roots, objectNames }
}
