import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ConfigError } from '@/config/ConfigError.js'
import { PERF_SNAPSHOT_FILENAME } from '@/perf/PERF_SNAPSHOT_FILENAME.js'
import type { PerfSnapshot } from '@/perf/PerfSnapshot.js'

export const readPerfSnapshot = (root: string): PerfSnapshot => {
  const path = join(root, PERF_SNAPSHOT_FILENAME)
  if (!existsSync(path)) {
    throw new ConfigError(
      `${PERF_SNAPSHOT_FILENAME} not found; run "codeality-db perf snapshot"`,
    )
  }
  const document = JSON.parse(
    readFileSync(path, 'utf8'),
  ) as Partial<PerfSnapshot>
  if (document.schemaVersion !== 1) {
    throw new ConfigError(
      `${PERF_SNAPSHOT_FILENAME} is not a version 1 snapshot`,
    )
  }
  return {
    schemaVersion: 1,
    toolVersion: document.toolVersion ?? '',
    takenAt: document.takenAt ?? '',
    host: document.host ?? '',
    statsReset: document.statsReset ?? null,
    statements: document.statements ?? [],
    tables: document.tables ?? [],
  }
}
