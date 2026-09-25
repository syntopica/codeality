import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import { detectStacks } from '@/config/detectStacks.js'
import type { ManagedFile } from '@/init/ManagedFile.js'
import { PERF_INIT_SECTION } from '@/init/PERF_INIT_SECTION.js'
import { upgradedConfigDocument } from '@/init/upgradedConfigDocument.js'

export const planConfigFile = (root: string, force: boolean): ManagedFile => {
  const path = join(root, CONFIG_FILENAME)
  const freshContent = `${JSON.stringify(
    { schemaVersion: 2, ...detectStacks(root), perf: PERF_INIT_SECTION },
    null,
    2,
  )}\n`
  if (!existsSync(path)) {
    return {
      path: CONFIG_FILENAME,
      disposition: 'create',
      detail: 'from the detected stacks',
      content: freshContent,
    }
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<
      string,
      unknown
    >
    const config = configFromDocument(raw)
    if (config.schemaVersion === 1) {
      return {
        path: CONFIG_FILENAME,
        disposition: 'merge',
        detail: 'upgraded to schemaVersion 2',
        content: `${JSON.stringify(
          upgradedConfigDocument(raw, detectStacks(root)),
          null,
          2,
        )}\n`,
      }
    }
    return { path: CONFIG_FILENAME, disposition: 'unchanged', detail: 'valid' }
  } catch (error) {
    return force
      ? {
          path: CONFIG_FILENAME,
          disposition: 'merge',
          detail: 'replaced (--force)',
          content: freshContent,
        }
      : {
          path: CONFIG_FILENAME,
          disposition: 'conflict',
          detail: (error as Error).message,
        }
  }
}
