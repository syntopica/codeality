export type PerfConfig = {
  inGate: boolean
  slowMs: number
  regressionPercent: number
  minCalls: number
  seqScanRows: number
  benchDir: string
  benchRuns: number
  benchTimeoutMs: number
  roles: string[]
  ignore: string[]
}
