import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import { readConfig } from '@/config/readConfig.js'
import { BENCH_README } from '@/init/BENCH_README.js'
import type { ManagedFile } from '@/init/ManagedFile.js'

/** Plans the bench directory's README, under whatever `perf.benchDir` the project already has. */
export const planBenchReadme = (root: string): ManagedFile => {
  const benchDir = (() => {
    try {
      return readConfig(root).perf.benchDir
    } catch {
      return PERF_DEFAULTS.benchDir
    }
  })()
  const relative = `${benchDir}/README.md`
  if (existsSync(join(root, relative))) {
    return { path: relative, disposition: 'unchanged', detail: 'present' }
  }
  return {
    path: relative,
    disposition: 'create',
    detail: 'explains the bench convention',
    content: BENCH_README,
  }
}
