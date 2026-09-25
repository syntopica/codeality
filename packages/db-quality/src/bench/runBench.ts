import type { BenchEntry } from '@/bench/BenchEntry.js'
import { benchFindings } from '@/bench/benchFindings.js'
import type { BenchJudgement } from '@/bench/BenchJudgement.js'
import type { BenchRecord } from '@/bench/BenchRecord.js'
import type { BenchResult } from '@/bench/BenchResult.js'
import { readBenchQueries } from '@/bench/readBenchQueries.js'
import { runBenchQuery } from '@/bench/runBenchQuery.js'
import type { Finding } from '@/model/Finding.js'
import type { Improvement } from '@/perf/Improvement.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

export const runBench = (
  session: PsqlSession,
  root: string,
  recorded: BenchRecord | undefined,
  judgement: BenchJudgement,
): BenchResult => {
  const { perf } = judgement
  const queries = readBenchQueries(root, perf.benchDir, perf.benchRuns)
  const entries: Record<string, BenchEntry> = {}
  const findings: Finding[] = []
  const improvements: Improvement[] = []
  for (const query of queries) {
    const entry = runBenchQuery(session, query)
    entries[query.file] = entry
    const recordedEntry = recorded?.entries[query.file]
    findings.push(
      ...benchFindings(
        { file: query.file, benchDir: perf.benchDir },
        recordedEntry,
        entry,
        judgement,
      ),
    )
    if (
      recordedEntry &&
      entry.medianMs <=
        recordedEntry.medianMs * (1 - perf.regressionPercent / 100)
    )
      improvements.push({
        subject: query.file,
        previousMs: recordedEntry.medianMs,
        currentMs: entry.medianMs,
        calls: entry.runs,
        savedMs: recordedEntry.medianMs - entry.medianMs,
      })
  }
  return { entries, findings, improvements }
}
