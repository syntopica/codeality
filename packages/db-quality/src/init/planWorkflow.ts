import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { assetPath } from '@/assetPath.js'
import type { ManagedFile } from '@/init/ManagedFile.js'
import { sha256Of } from '@/init/sha256Of.js'
import { SHIPPED_WORKFLOW_HASHES } from '@/init/SHIPPED_WORKFLOW_HASHES.js'

export const planWorkflow = (root: string, force: boolean): ManagedFile => {
  const relative = '.github/workflows/db-quality.yml'
  const content = readFileSync(assetPath('db-quality.yml'), 'utf8')
  const path = join(root, relative)
  if (!existsSync(path)) {
    const detail = 'runs codeality-db gate on push and pull request'
    return { path: relative, disposition: 'create', detail, content }
  }
  const existing = readFileSync(path, 'utf8')
  if (existing === content) {
    return { path: relative, disposition: 'unchanged', detail: 'identical' }
  }
  const shippedVersion = SHIPPED_WORKFLOW_HASHES[sha256Of(existing)]
  if (shippedVersion !== undefined) {
    return {
      path: relative,
      disposition: 'merge',
      detail: `upgraded from the ${shippedVersion} workflow`,
      content,
    }
  }
  return force
    ? {
        path: relative,
        disposition: 'merge',
        detail: 'replaced (--force)',
        content,
      }
    : {
        path: relative,
        disposition: 'conflict',
        detail: 'differs from the shipped workflow',
      }
}
