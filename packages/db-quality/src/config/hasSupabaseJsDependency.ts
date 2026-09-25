import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { PackageManifest } from '@/config/PackageManifest.js'

export const hasSupabaseJsDependency = (root: string): boolean => {
  const manifestPath = join(root, 'package.json')
  if (!existsSync(manifestPath)) return false
  const manifest = JSON.parse(
    readFileSync(manifestPath, 'utf8'),
  ) as PackageManifest
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
  return '@supabase/supabase-js' in dependencies
}
