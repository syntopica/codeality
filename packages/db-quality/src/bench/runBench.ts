import type { BenchEntry } from '@/bench/BenchEntry.js'
import { benchFindings } from '@/bench/benchFindings.js'
import type { BenchRecord } from '@/bench/BenchRecord.js'
import type { BenchResult } from '@/bench/BenchResult.js'
import { readBenchQueries } from '@/bench/readBenchQueries.js'
import { runBenchQuery } from '@/bench/runBenchQuery.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { PerfConfig } from '@/config/PerfConfig.js'
import type { Finding } from '@/model/Finding.js'
import type { Improvement } from '@/perf/Improvement.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

// Five positional parameters: the read-only session, the project root, perf
// config, the optional recorded baseline and the disable list, exactly what
// the gate stage and `perf bench --record` each already hold, so neither has
// to assemble an options object to call this. See eslint.config.ts for the
// matching max-params exemption.
export const runBench = (
  session: PsqlSession,
  root: string,
  perf: PerfConfig,
  recorded: BenchRecord | undefined,
  disabled: DisableEntry[],
): BenchResult => {
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
        { perf, disabled },
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
