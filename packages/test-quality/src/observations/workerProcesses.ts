import type { Observation } from '@/model/Observation.js'

/**
 * The most processes seen under vitest in one sample. It is a floor, not a
 * ceiling: sampling once a second misses a peak between two samples, and it
 * counts whatever runs under vitest, forked workers and any process a test
 * spawns alike. A threads pool runs its workers inside vitest, so it adds none.
 */
export const workerProcesses = (samples: number[]): Observation[] => {
  if (samples.length === 0) return []
  return [
    {
      name: 'worker-processes',
      message: `${String(Math.max(...samples))} processes were seen under vitest at once, sampled once a second, so the peak may be higher (forked workers and anything a test spawns; a threads pool adds none)`,
      evidence: [],
    },
  ]
}
