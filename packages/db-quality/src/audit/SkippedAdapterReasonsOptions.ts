import type { AuditTarget } from '@/audit/AuditTarget.js'

/** Parameters for building the human-readable list of skipped adapters. */
export type SkippedAdapterReasonsOptions = {
  supabase: boolean
  soda: boolean
  sodaConfigured: boolean
  databaseTypeConfigured: boolean
  target: AuditTarget
  dialect: 'postgres' | 'mysql' | undefined
}
