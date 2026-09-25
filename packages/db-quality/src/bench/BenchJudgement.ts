import type { DisableEntry } from '@/config/DisableEntry.js'
import type { PerfConfig } from '@/config/PerfConfig.js'

export type BenchJudgement = { perf: PerfConfig; disabled: DisableEntry[] }
