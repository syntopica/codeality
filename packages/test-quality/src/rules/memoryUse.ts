import type { Finding } from '@/model/Finding.js'

/** Peak and mean resident memory of the run, from its one-second samples. */
export const memoryUse = (samplesMb: number[]): Finding[] => {
  if (samplesMb.length === 0) return []
  const peak = Math.max(...samplesMb)
  const mean = samplesMb.reduce((sum, mb) => sum + mb, 0) / samplesMb.length
  return [
    {
      rule: 'memory-use',
      severity: 'info',
      message: `vitest and its workers peaked at ${peak.toFixed(0)} MB, mean ${mean.toFixed(0)} MB over ${String(samplesMb.length)} samples`,
      evidence: [],
    },
  ]
}
