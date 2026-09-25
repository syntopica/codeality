import type { BenchEntry } from '@/bench/BenchEntry.js'
import type { BenchQuery } from '@/bench/BenchQuery.js'
import type { ExplainSummary } from '@/bench/ExplainSummary.js'
import { median } from '@/bench/median.js'
import { summarizeExplain } from '@/bench/summarizeExplain.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

/** Runs the query once as a warm-up (discarded), then `query.runs` times, taking the median. */
export const runBenchQuery = (
  session: PsqlSession,
  query: BenchQuery,
): BenchEntry => {
  session.explain(query.sql)
  const times: number[] = []
  let last: ExplainSummary | undefined
  for (let run = 0; run < query.runs; run += 1) {
    last = summarizeExplain(session.explain(query.sql))
    times.push(last.executionMs)
  }
  if (!last) throw new Error(`${query.file} has zero runs`)
  return {
    medianMs: median(times),
    minMs: Math.min(...times),
    runs: query.runs,
    seqScans: last.seqScans,
    indexScans: last.indexScans,
    worstEstimateRatio: last.worstEstimateRatio,
  }
}
