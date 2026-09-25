import type { DisableEntry } from '@/config/DisableEntry.js'
import type { PerfConfig } from '@/config/PerfConfig.js'
import type { PostgrestConfig } from '@/config/PostgrestConfig.js'

export type DbQualityConfig = {
  schemaVersion: 1 | 2
  supabase?: { migrations: string }
  prisma?: { schema: string }
  drizzle?: { roots: string[]; objectNames: string[] }
  sqlite?: { files: string[] }
  postgrest?: PostgrestConfig
  audit: { inGate: boolean; bloatThreshold: number; soda?: string }
  perf: PerfConfig
  disable: DisableEntry[]
}
