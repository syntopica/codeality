export type BenchEntry = {
  medianMs: number
  minMs: number
  runs: number
  seqScans: { relation: string; rows: number }[]
  indexScans: string[]
  worstEstimateRatio: number
}
