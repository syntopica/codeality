import { auditSectionFrom } from '@/config/auditSectionFrom.js'
import { CONFIG_KEYS } from '@/config/CONFIG_KEYS.js'
import { ConfigError } from '@/config/ConfigError.js'
import { configSection } from '@/config/configSection.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { isStringList } from '@/config/isStringList.js'
import { stackSectionsFrom } from '@/config/stackSectionsFrom.js'

/** Validates a parsed codeality-db.json and fills its defaults; ConfigError on any defect. */
export const configFromDocument = (document: unknown): DbQualityConfig => {
  if (
    typeof document !== 'object' ||
    document === null ||
    Array.isArray(document)
  ) {
    throw new ConfigError('configuration must be an object')
  }
  const raw = document as Record<string, unknown>
  for (const key of Object.keys(raw)) {
    if (!CONFIG_KEYS.has(key)) throw new ConfigError(`unknown key "${key}"`)
  }
  if (raw['schemaVersion'] !== 1)
    throw new ConfigError('schemaVersion must be 1')
  const disable = raw['disable'] ?? []
  if (!isStringList(disable))
    throw new ConfigError('disable must be a list of strings')
  return {
    schemaVersion: 1,
    ...stackSectionsFrom(raw),
    audit: auditSectionFrom(configSection(raw, 'audit')),
    disable,
  }
}
