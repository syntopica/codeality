import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { findSqliteFiles } from '@/config/findSqliteFiles.js'
import { hasPostgrestSources } from '@/config/hasPostgrestSources.js'
import { hasSupabaseJsDependency } from '@/config/hasSupabaseJsDependency.js'
import { isDirectory } from '@/config/isDirectory.js'
import type { StackSections } from '@/config/StackSections.js'

export const detectStacks = (root: string): StackSections => {
  const sqliteFiles = findSqliteFiles(root)
  const hasDrizzle = ['ts', 'js', 'mjs'].some((ext) =>
    existsSync(join(root, `drizzle.config.${ext}`)),
  )
  const drizzleRoots = ['src', 'server', 'app', 'lib', 'db'].filter((name) =>
    isDirectory(join(root, name)),
  )
  const postgrestRoots = ['src', 'app', 'supabase/functions'].filter(
    (name) => isDirectory(join(root, name)) && hasPostgrestSources(root, name),
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
    ...(hasSupabaseJsDependency(root) && postgrestRoots.length > 0
      ? { postgrest: { roots: postgrestRoots } }
      : {}),
  }
}
