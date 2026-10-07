import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { PackageManifest } from '@/config/PackageManifest.js'

/** The project's dependencies and devDependencies together; none without a package.json. */
export const manifestDependencies = (root: string): Record<string, string> => {
  const manifestPath = join(root, 'package.json')
  if (!existsSync(manifestPath)) return {}
  const manifest = JSON.parse(
    readFileSync(manifestPath, 'utf8'),
  ) as PackageManifest
  return { ...manifest.dependencies, ...manifest.devDependencies }
}
