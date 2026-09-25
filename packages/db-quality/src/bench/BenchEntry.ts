import type { SeqScanStat } from '@/bench/SeqScanStat.js'

export type BenchEntry = {
  medianMs: number
  minMs: number
  runs: number
  seqScans: SeqScanStat[]
  indexScans: string[]
  worstEstimateRatio: number
}
