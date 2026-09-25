import { BASELINE_USAGE } from '@/baseline/BASELINE_USAGE.js'
import type { BaselineAction } from '@/baseline/BaselineAction.js'
import { ConfigError } from '@/config/ConfigError.js'

export const baselineActionFrom = (positionals: string[]): BaselineAction => {
  const action = positionals[0]
  if (action === 'create' || action === 'update' || action === 'check')
    return action
  throw new ConfigError(BASELINE_USAGE)
}
