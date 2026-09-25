import type { CheckContext } from '@/check/CheckContext.js'
import type { Finding } from '@/model/Finding.js'
import { diffSnapshots } from '@/perf/diffSnapshots.js'
import { QUERY_TIMEOUT_MS } from '@/perf/QUERY_TIMEOUT_MS.js'
import { readPerfSnapshot } from '@/perf/readPerfSnapshot.js'
import { takePerfSnapshot } from '@/perf/takePerfSnapshot.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import { psqlSession } from '@/postgres/psqlSession.js'

/** The gate's own diff: takes a fresh snapshot and compares it against the recorded one, never writing it. */
export const perfDiffFindings = (
  { root, config, runner }: CheckContext,
  target: PostgresTarget,
): Finding[] => {
  const session = psqlSession(runner, root, target, QUERY_TIMEOUT_MS)
  const current = takePerfSnapshot(
    session,
    config.perf,
    target.host,
    new Date().toISOString(),
  )
  return diffSnapshots(
    readPerfSnapshot(root),
    current,
    config.perf,
    config.disable,
  ).findings
}
