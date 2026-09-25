import type { PerfConfig } from '@/config/PerfConfig.js'

export const PERF_DEFAULTS: PerfConfig = {
  inGate: false,
  slowMs: 100,
  regressionPercent: 20,
  minCalls: 20,
  seqScanRows: 10000,
  benchDir: 'db-quality/bench',
  benchRuns: 5,
  benchTimeoutMs: 60000,
  roles: ['authenticator', 'service_role', 'postgres'],
  ignore: [],
}
