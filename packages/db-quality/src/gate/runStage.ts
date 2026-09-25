import { performance } from 'node:perf_hooks'

import { renderFindings } from '@/check/renderFindings.js'
import type { Stage } from '@/gate/Stage.js'
import type { StageResult } from '@/gate/StageResult.js'
import type { StageStatus } from '@/gate/StageStatus.js'

export const runStage = (stage: Stage): StageResult => {
  const started = performance.now()
  const done = (status: StageStatus, detail: string): StageResult => ({
    name: stage.name,
    status,
    durationSeconds: (performance.now() - started) / 1000,
    detail,
  })
  try {
    const outcome = stage.run()
    if (outcome === 'not-applicable') return done('skipped-not-applicable', '')
    return outcome.length === 0
      ? done('passed', '')
      : done('findings', renderFindings(outcome))
  } catch (error) {
    return done(
      'failed-to-run',
      error instanceof Error ? error.message : String(error),
    )
  }
}
