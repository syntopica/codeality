import { ConfigError } from '@/config/ConfigError.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import { LEGACY_DISABLE_REASON } from '@/config/LEGACY_DISABLE_REASON.js'

/** One raw `disable` entry, validated against its schemaVersion's shape. */
export const disableEntryFrom = (
  raw: unknown,
  schemaVersion: 1 | 2,
): DisableEntry => {
  if (typeof raw === 'string') {
    if (schemaVersion === 1) return { code: raw, reason: LEGACY_DISABLE_REASON }
    throw new ConfigError(
      `disable entries must be { "code": "${raw}", "reason": "why" } under schemaVersion 2`,
    )
  }
  if (typeof raw !== 'object' || raw === null)
    throw new ConfigError('disable entries must be objects')
  const { code, reason } = raw as Record<string, unknown>
  if (typeof code !== 'string')
    throw new ConfigError('disable code must be a string')
  if (typeof reason !== 'string' || reason.trim() === '')
    throw new ConfigError(`disable reason must not be empty (${code})`)
  return { code, reason }
}
