import type { DisableEntry } from '@/config/DisableEntry.js'

export type DbQualityConfig = {
  schemaVersion: 1 | 2
  supabase?: { migrations: string }
  prisma?: { schema: string }
  drizzle?: { roots: string[]; objectNames: string[] }
  sqlite?: { files: string[] }
  audit: { inGate: boolean; bloatThreshold: number; soda?: string }
  disable: DisableEntry[]
}
