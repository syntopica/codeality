import type { HostLoad } from '@/model/HostLoad.js'
import type { VitestJsonReport } from '@/model/VitestJsonReport.js'

/** One measured `vitest run`: its output, report, wall time, samples and host. */
export type VitestRun = {
  exitCode: number
  stdout: string
  report: VitestJsonReport | null
  wallSeconds: number
  /** Resident memory of vitest and every process under it, in MB, per sample. */
  rssSamplesMb: number[]
  /** Processes under vitest per sample: forked workers and what tests spawn. */
  workerSamples: number[]
  host: HostLoad
}
