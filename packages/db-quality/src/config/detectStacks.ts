import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { findSqliteFiles } from '@/config/findSqliteFiles.js'
import { isDirectory } from '@/config/isDirectory.js'

export const detectStacks = (
  root: string,
): Omit<DbQualityConfig, 'audit' | 'disable' | 'schemaVersion'> => {
  const sqliteFiles = findSqliteFiles(root)
  const hasDrizzle = ['ts', 'js', 'mjs'].some((ext) =>
    existsSync(join(root, `drizzle.config.${ext}`)),
  )
  const drizzleRoots = ['src', 'server', 'app', 'lib', 'db'].filter((name) =>
    isDirectory(join(root, name)),
  )
  return {
    ...(isDirectory(join(root, 'supabase/migrations'))
      ? { supabase: { migrations: 'supabase/migrations' } }
      : {}),
    ...(existsSync(join(root, 'prisma/schema.prisma'))
      ? { prisma: { schema: 'prisma/schema.prisma' } }
      : {}),
    ...(hasDrizzle
      ? { drizzle: { roots: drizzleRoots, objectNames: ['db', 'tx'] } }
      : {}),
    ...(sqliteFiles.length > 0 ? { sqlite: { files: sqliteFiles } } : {}),
  }
}
