import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import { detectStacks } from '@/config/detectStacks.js'
import type { ManagedFile } from '@/init/ManagedFile.js'

export const planConfigFile = (root: string, force: boolean): ManagedFile => {
  const content = `${JSON.stringify({ schemaVersion: 1, ...detectStacks(root) }, null, 2)}\n`
  const path = join(root, CONFIG_FILENAME)
  if (!existsSync(path)) {
    return {
      path: CONFIG_FILENAME,
      disposition: 'create',
      detail: 'from the detected stacks',
      content,
    }
  }
  try {
    configFromDocument(JSON.parse(readFileSync(path, 'utf8')))
    return { path: CONFIG_FILENAME, disposition: 'unchanged', detail: 'valid' }
  } catch (error) {
    return force
      ? {
          path: CONFIG_FILENAME,
          disposition: 'merge',
          detail: 'replaced (--force)',
          content,
        }
      : {
          path: CONFIG_FILENAME,
          disposition: 'conflict',
          detail: (error as Error).message,
        }
  }
}
