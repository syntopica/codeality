import type { BenchEntry } from '@/bench/BenchEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { Improvement } from '@/perf/Improvement.js'

export type BenchResult = {
  entries: Record<string, BenchEntry>
  findings: Finding[]
  improvements: Improvement[]
}
