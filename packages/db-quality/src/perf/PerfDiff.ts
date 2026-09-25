import type { Finding } from '@/model/Finding.js'
import type { Improvement } from '@/perf/Improvement.js'

export type PerfDiff = {
  from: string
  to: string
  improvements: Improvement[]
  findings: Finding[]
  savedMs: number
  lostMs: number
}
