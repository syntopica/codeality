import type { VitestRun } from '@/model/VitestRun.js'

/** A measured run with sensible defaults, overridden per test. */
export const vitestRun = (overrides: Partial<VitestRun>): VitestRun => ({
  exitCode: 0,
  stdout: '',
  report: { testResults: [] },
  wallSeconds: 10,
  rssSamplesMb: [],
  workerSamples: [],
  host: { cpus: 8, loadBefore: 1, loadAfter: 2 },
  ...overrides,
})
