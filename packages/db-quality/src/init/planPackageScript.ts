import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { ManagedFile } from '@/init/ManagedFile.js'
import { PACKAGE_MANIFEST } from '@/init/PACKAGE_MANIFEST.js'

export const planPackageScript = (
  root: string,
  force: boolean,
): ManagedFile => {
  const path = join(root, PACKAGE_MANIFEST)
  if (!existsSync(path)) {
    return {
      path: PACKAGE_MANIFEST,
      disposition: 'unchanged',
      detail: 'no package.json',
    }
  }
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
    scripts?: Record<string, string>
  }
  const current = manifest.scripts?.['db:gate']
  if (current === 'codeality-db gate') {
    return {
      path: PACKAGE_MANIFEST,
      disposition: 'unchanged',
      detail: 'db:gate present',
    }
  }
  if (current !== undefined && !force) {
    return {
      path: PACKAGE_MANIFEST,
      disposition: 'conflict',
      detail: `db:gate is "${current}"`,
    }
  }
  const scripts = { ...manifest.scripts, 'db:gate': 'codeality-db gate' }
  const content = `${JSON.stringify({ ...manifest, scripts }, null, 2)}\n`
  return {
    path: PACKAGE_MANIFEST,
    disposition: 'merge',
    detail: 'add scripts.db:gate',
    content,
  }
}
