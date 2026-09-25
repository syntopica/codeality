export type ExplainSummary = {
  executionMs: number
  seqScans: { relation: string; rows: number }[]
  indexScans: string[]
  worstEstimateRatio: number
}
