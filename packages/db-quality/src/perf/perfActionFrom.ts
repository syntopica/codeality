import { PERF_USAGE } from '@/perf/PERF_USAGE.js'
import type { PerfAction } from '@/perf/PerfAction.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

export const perfActionFrom = (positionals: string[]): PerfAction => {
  const action = positionals[0]
  if (action === 'snapshot' || action === 'diff' || action === 'bench')
    return action
  throw new ConfigError(PERF_USAGE)
}
