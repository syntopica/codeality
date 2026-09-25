import { auditSectionFrom } from '@/config/auditSectionFrom.js'
import { CONFIG_KEYS } from '@/config/CONFIG_KEYS.js'
import { ConfigError } from '@/config/ConfigError.js'
import { configSection } from '@/config/configSection.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { disableEntriesFrom } from '@/config/disableEntriesFrom.js'
import { perfSectionFrom } from '@/config/perfSectionFrom.js'
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
  const schemaVersion = raw['schemaVersion']
  if (schemaVersion !== 1 && schemaVersion !== 2)
    throw new ConfigError('schemaVersion must be 1 or 2')
  return {
    schemaVersion,
    ...stackSectionsFrom(raw),
    audit: auditSectionFrom(configSection(raw, 'audit')),
    perf: perfSectionFrom(configSection(raw, 'perf')),
    disable: disableEntriesFrom(raw['disable'], schemaVersion),
  }
}
