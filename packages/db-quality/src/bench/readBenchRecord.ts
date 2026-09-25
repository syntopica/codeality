import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BENCH_RECORD_FILENAME } from '@/bench/BENCH_RECORD_FILENAME.js'
import type { BenchRecord } from '@/bench/BenchRecord.js'
import { ConfigError } from '@/config/ConfigError.js'

/** `undefined` when the record is absent: the caller decides what that means. */
export const readBenchRecord = (root: string): BenchRecord | undefined => {
  const path = join(root, BENCH_RECORD_FILENAME)
  if (!existsSync(path)) return undefined
  const document = JSON.parse(
    readFileSync(path, 'utf8'),
  ) as Partial<BenchRecord>
  if (document.schemaVersion !== 1)
    throw new ConfigError(
      `${BENCH_RECORD_FILENAME} is not a version 1 bench record`,
    )
  return {
    schemaVersion: 1,
    toolVersion: document.toolVersion ?? '',
    takenAt: document.takenAt ?? '',
    host: document.host ?? '',
    entries: document.entries ?? {},
  }
}
