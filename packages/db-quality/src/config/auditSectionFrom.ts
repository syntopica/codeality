import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { expectConfig } from '@/config/expectConfig.js'

export const auditSectionFrom = (
  audit: Record<string, unknown> | undefined,
): DbQualityConfig['audit'] => {
  const inGate = audit?.['inGate'] ?? true
  const bloatThreshold = audit?.['bloatThreshold'] ?? 5
  const soda = audit?.['soda']
  expectConfig(typeof inGate === 'boolean', 'audit.inGate must be a boolean')
  expectConfig(
    typeof bloatThreshold === 'number',
    'audit.bloatThreshold must be a number',
  )
  expectConfig(
    soda === undefined || typeof soda === 'string',
    'audit.soda must be a string',
  )
  return {
    inGate: inGate as boolean,
    bloatThreshold: bloatThreshold as number,
    ...(soda === undefined ? {} : { soda: soda as string }),
  }
}
