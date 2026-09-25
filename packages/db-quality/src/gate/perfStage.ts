import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'
import type { CheckContext } from '@/check/CheckContext.js'
import { perfBenchFindings } from '@/gate/perfBenchFindings.js'
import { perfDiffFindings } from '@/gate/perfDiffFindings.js'
import type { Stage } from '@/gate/Stage.js'
import type { StageOutcome } from '@/gate/StageOutcome.js'
import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'

// The stage says what it did not measure: a green stage that measured
// nothing is exactly the false comfort the gate exists to remove.
export const perfStage = (context: CheckContext): Stage => ({
  name: 'perf',
  run: (): StageOutcome => {
    if (!context.config.perf.inGate) return 'not-applicable'
    const target = resolvePostgresTarget(context.root, {})
    if (!target)
      return {
        skipped: 'no linked project with SUPABASE_DB_PASSWORD',
      }
    const hasSnapshot = existsSync(join(context.root, PERF_SNAPSHOT_FILENAME))
    const hasRecord = existsSync(join(context.root, BENCH_RECORD_FILENAME))
    if (!hasSnapshot && !hasRecord)
      return {
        skipped:
          'no perf snapshot and no bench record; run "perf snapshot" or "perf bench --record"',
      }
    return [
      ...(hasSnapshot ? perfDiffFindings(context, target) : []),
      ...(hasRecord ? perfBenchFindings(context, target) : []),
    ]
  },
})
