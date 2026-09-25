import type { BenchEntry } from '@/bench/BenchEntry.js'
import { benchFinding } from '@/bench/benchFinding.js'
import type { BenchFindingsInput } from '@/bench/BenchFindingsInput.js'
import type { BenchJudgement } from '@/bench/BenchJudgement.js'
import { isDisabled } from '@/config/isDisabled.js'
import type { Finding } from '@/model/Finding.js'

// Three codes: BDB911 a query that got materially slower against its record,
// BDB912 a sequential scan the record did not have (over a big table, or over
// a relation the record used to reach by index), BDB913 a planner estimate
// far off from what actually happened.
export const benchFindings = (
  input: BenchFindingsInput,
  recorded: BenchEntry | undefined,
  current: BenchEntry,
  judgement: BenchJudgement,
): Finding[] => {
  const { perf, disabled } = judgement
  const findings: Finding[] = []
  const add = (code: string, subject: string, message: string): void => {
    findings.push(benchFinding(input, code, subject, message))
  }
  const slower =
    recorded &&
    current.medianMs >=
      recorded.medianMs * (1 + perf.regressionPercent / 100) &&
    current.medianMs - recorded.medianMs >= 5
  if (slower)
    add(
      'BDB911',
      input.file,
      `median ${recorded.medianMs.toFixed(2)} ms -> ${current.medianMs.toFixed(2)} ms (+${String(Math.round((current.medianMs / recorded.medianMs - 1) * 100))}%) over ${String(current.runs)} runs`,
    )
  const newScans = recorded
    ? current.seqScans.filter(
        (scan) =>
          !recorded.seqScans.some((r) => r.relation === scan.relation) &&
          (scan.rows >= perf.seqScanRows ||
            recorded.indexScans.includes(scan.relation)),
      )
    : []
  for (const scan of newScans)
    add(
      'BDB912',
      scan.relation,
      `sequential scan over ${scan.rows.toLocaleString('en-US')} rows of "${scan.relation}" where the record had ${recorded?.indexScans.includes(scan.relation) ? 'an index scan' : 'none'}`,
    )
  if (current.worstEstimateRatio >= 100)
    add(
      'BDB913',
      input.file,
      `planner estimate off by ${String(Math.round(current.worstEstimateRatio))}x: run ANALYZE or raise the statistics target`,
    )
  return findings.filter((f) => !isDisabled(f.code, disabled))
}
