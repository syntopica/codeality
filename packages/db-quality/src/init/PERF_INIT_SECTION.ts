import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import type { PerfConfig } from '@/config/PerfConfig.js'

/** The perf section `init` writes: the usual defaults, but out of the gate until adopted. */
export const PERF_INIT_SECTION: PerfConfig = { ...PERF_DEFAULTS, inGate: false }
