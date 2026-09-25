import { ConfigError } from '@/config/ConfigError.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { disableEntryFrom } from '@/config/disableEntryFrom.js'

export const disableEntriesFrom = (
  raw: unknown,
  schemaVersion: 1 | 2,
): DisableEntry[] => {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) throw new ConfigError('disable must be a list')
  return raw.map((entry) => disableEntryFrom(entry, schemaVersion))
}
