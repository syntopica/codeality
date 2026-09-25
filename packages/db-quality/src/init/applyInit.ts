import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { ManagedFile } from '@/init/ManagedFile.js'

export const applyInit = (root: string, plan: ManagedFile[]): void => {
  for (const file of plan) {
    const writes = file.disposition === 'create' || file.disposition === 'merge'
    if (!writes || file.content === undefined) continue
    mkdirSync(dirname(join(root, file.path)), { recursive: true })
    writeFileSync(join(root, file.path), file.content)
  }
}
