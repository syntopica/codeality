import { performance } from 'node:perf_hooks'

import { renderFindings } from '@/check/renderFindings.js'
import type { Stage } from '@/gate/Stage.js'
import type { StageResult } from '@/gate/StageResult.js'
import type { StageStatus } from '@/gate/StageStatus.js'
import type { Finding } from '@/model/Finding.js'
import { findingDiagnostic } from '@/report/findingDiagnostic.js'

export const runStage = (stage: Stage): StageResult => {
  const started = performance.now()
  const rerun = stage.rerun ?? (() => 'codeality-db gate --json')
  const done = (
    status: StageStatus,
    detail: string,
    findings: Finding[] = [],
  ): StageResult => ({
    name: stage.name,
    status,
    durationSeconds: (performance.now() - started) / 1000,
    detail,
    diagnostics: findings.map((finding) =>
      findingDiagnostic(finding, rerun(finding)),
    ),
  })
  try {
    const outcome = stage.run()
    if (outcome === 'not-applicable') return done('skipped-not-applicable', '')
    if (!Array.isArray(outcome))
      return done('skipped-not-applicable', outcome.skipped)
    return outcome.length === 0
      ? done('passed', '')
      : done('findings', renderFindings(outcome), outcome)
  } catch (error) {
    return done(
      'failed-to-run',
      error instanceof Error ? error.message : String(error),
    )
  }
}
