import type { Observation } from '@/model/Observation.js'
import type { VitestRun } from '@/model/VitestRun.js'

/** How the measured run ended and how long it took on the wall clock. */
export const suiteRun = (run: VitestRun): Observation => ({
  name: 'suite-run',
  message: `vitest exited ${String(run.exitCode)} after ${run.wallSeconds.toFixed(1)} s wall`,
  evidence: [],
})
