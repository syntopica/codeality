import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import type { AdoptionPhaseNumber } from '@/init/AdoptionPhaseNumber.js'
import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'

/** Where a project stands on the phased adoption ladder, from its config and its recorded files. */
export const adoptionPhase = (
  root: string,
  config: DbQualityConfig,
): AdoptionPhaseNumber => {
  if (config.schemaVersion !== 2) return 0
  const hasSnapshot = existsSync(join(root, PERF_SNAPSHOT_FILENAME))
  const hasBench = existsSync(join(root, BENCH_RECORD_FILENAME))
  if (config.perf.inGate && (hasSnapshot || hasBench)) return 4
  if (hasBench) return 3
  if (hasSnapshot) return 2
  return 1
}
