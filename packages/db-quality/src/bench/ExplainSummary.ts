import type { SeqScanStat } from '@/bench/SeqScanStat.js'

export type ExplainSummary = {
  executionMs: number
  seqScans: SeqScanStat[]
  indexScans: string[]
  worstEstimateRatio: number
}
