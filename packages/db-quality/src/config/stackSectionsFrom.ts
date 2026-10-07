import { configSection } from '@/config/configSection.js'
import { drizzleSectionFrom } from '@/config/drizzleSectionFrom.js'
import { kyselySectionFrom } from '@/config/kyselySectionFrom.js'
import { postgrestSectionFrom } from '@/config/postgrestSectionFrom.js'
import { sqliteSectionFrom } from '@/config/sqliteSectionFrom.js'
import type { StackSections } from '@/config/StackSections.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

export const stackSectionsFrom = (
  raw: Record<string, unknown>,
): StackSections => {
  const stacks: StackSections = {}
  const supabase = configSection(raw, 'supabase')
  if (supabase) {
    const migrations = supabase['migrations']
    if (typeof migrations !== 'string')
      throw new ConfigError('supabase.migrations must be a string')
    stacks.supabase = { migrations }
  }
  const prisma = configSection(raw, 'prisma')
  if (prisma) {
    const schema = prisma['schema']
    if (typeof schema !== 'string')
      throw new ConfigError('prisma.schema must be a string')
    stacks.prisma = { schema }
  }
  const drizzle = configSection(raw, 'drizzle')
  if (drizzle) stacks.drizzle = drizzleSectionFrom(drizzle)
  const kysely = configSection(raw, 'kysely')
  if (kysely) stacks.kysely = kyselySectionFrom(kysely)
  const sqlite = configSection(raw, 'sqlite')
  if (sqlite) stacks.sqlite = sqliteSectionFrom(sqlite)
  const postgrest = configSection(raw, 'postgrest')
  if (postgrest) stacks.postgrest = postgrestSectionFrom(postgrest)
  return stacks
}
