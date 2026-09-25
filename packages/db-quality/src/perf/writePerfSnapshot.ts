import { renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'

/** Writes the snapshot atomically: a temporary file, then a rename over the target. */
export const writePerfSnapshot = (
  root: string,
  snapshot: PerfSnapshot,
): void => {
  const path = join(root, PERF_SNAPSHOT_FILENAME)
  writeFileSync(`${path}.tmp`, `${JSON.stringify(snapshot, null, 2)}\n`)
  renameSync(`${path}.tmp`, path)
}
