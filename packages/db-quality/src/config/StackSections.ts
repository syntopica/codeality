import type { DbQualityConfig } from '@/config/DbQualityConfig.js'

export type StackSections = Pick<
  DbQualityConfig,
  'supabase' | 'prisma' | 'drizzle' | 'sqlite' | 'postgrest'
>
