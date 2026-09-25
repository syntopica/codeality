import { ConfigError } from '@/config/ConfigError.js'
import { isStringList } from '@/config/isStringList.js'
import type { PostgrestConfig } from '@/config/PostgrestConfig.js'

export const postgrestSectionFrom = (
  raw: Record<string, unknown>,
): PostgrestConfig => {
  const roots = raw['roots']
  if (!isStringList(roots))
    throw new ConfigError('postgrest.roots must be a list of strings')
  if (roots.length === 0)
    throw new ConfigError('postgrest.roots must name at least one directory')
  return { roots }
}
