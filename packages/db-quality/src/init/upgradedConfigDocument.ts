import { LEGACY_DISABLE_REASON } from '@/config/LEGACY_DISABLE_REASON.js'
import type { StackSections } from '@/config/StackSections.js'
import { PERF_INIT_SECTION } from '@/init/PERF_INIT_SECTION.js'

/** Upgrades a valid schemaVersion 1 document to 2, keeping every section already present. */
export const upgradedConfigDocument = (
  raw: Record<string, unknown>,
  detected: StackSections,
): Record<string, unknown> => {
  const disable = raw['disable']
  return {
    ...raw,
    schemaVersion: 2,
    ...(Array.isArray(disable)
      ? {
          disable: disable.map((entry: unknown) =>
            typeof entry === 'string'
              ? { code: entry, reason: LEGACY_DISABLE_REASON }
              : entry,
          ),
        }
      : {}),
    ...(raw['postgrest'] === undefined && detected.postgrest !== undefined
      ? { postgrest: detected.postgrest }
      : {}),
    ...(raw['perf'] === undefined ? { perf: PERF_INIT_SECTION } : {}),
  }
}
