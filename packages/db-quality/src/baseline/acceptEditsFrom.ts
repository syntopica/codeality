import type { BaselineAction } from '@/baseline/BaselineAction.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'
import type { ParsedArgs } from '@syntopica/gate-kit/ParsedArgs'

/** The comma-separated `--accept-edit` names; ConfigError on any action but `update`. */
export const acceptEditsFrom = (
  values: ParsedArgs['values'],
  action: BaselineAction,
): string[] => {
  const raw = values['accept-edit']
  if (typeof raw !== 'string') return []
  if (action !== 'update')
    throw new ConfigError('--accept-edit applies to "baseline update" only')
  return raw
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
}
