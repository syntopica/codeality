import type { VitestJsonReport } from '@/model/VitestJsonReport.js'

/** One measured `vitest run`: its output, report, wall time and memory samples. */
export type VitestRun = {
  exitCode: number
  stdout: string
  report: VitestJsonReport | null
  wallSeconds: number
  /** Resident memory of vitest and every process under it, in MB, per sample. */
  rssSamplesMb: number[]
}
