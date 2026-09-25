import { renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'
import type { BenchRecord } from '@/bench/BenchRecord.js'

/** Writes the record atomically: a temporary file, then a rename over the target. */
export const writeBenchRecord = (root: string, record: BenchRecord): void => {
  const path = join(root, BENCH_RECORD_FILENAME)
  writeFileSync(`${path}.tmp`, `${JSON.stringify(record, null, 2)}\n`)
  renameSync(`${path}.tmp`, path)
}
