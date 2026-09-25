import { ConfigError } from '@/config/ConfigError.js'
import { PERF_USAGE } from '@/perf/PERF_USAGE.js'
import type { PerfAction } from '@/perf/PerfAction.js'

export const perfActionFrom = (positionals: string[]): PerfAction => {
  const action = positionals[0]
  if (action === 'snapshot' || action === 'diff' || action === 'bench')
    return action
  throw new ConfigError(PERF_USAGE)
}
