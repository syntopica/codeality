import type { AuditTarget } from '@/audit/AuditTarget.js'

/** The Supabase CLI flags that name the database to inspect. */
export const targetArgs = (target: AuditTarget): string[] =>
  'dbUrl' in target ? ['--db-url', target.dbUrl] : ['--linked']
