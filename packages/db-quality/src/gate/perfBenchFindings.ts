import { readBenchRecord } from '@/bench/readBenchRecord.js'
import { runBench } from '@/bench/runBench.js'
import type { CheckContext } from '@/check/CheckContext.js'
import type { Finding } from '@/model/Finding.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import { psqlSession } from '@/postgres/psqlSession.js'

/** The gate's own bench: replays the recorded queries and compares against the recorded medians. */
export const perfBenchFindings = (
  { root, config, runner }: CheckContext,
  target: PostgresTarget,
): Finding[] => {
  const session = psqlSession(runner, root, target, config.perf.benchTimeoutMs)
  return runBench(session, root, readBenchRecord(root), {
    perf: config.perf,
    disabled: config.disable,
  }).findings
}
