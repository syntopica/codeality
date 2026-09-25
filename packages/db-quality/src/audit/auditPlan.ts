import type { AuditTarget } from '@/audit/AuditTarget.js'
import { isSupabaseHost } from '@/audit/isSupabaseHost.js'
import { ConfigError } from '@/config/ConfigError.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'

/**
 * Which live adapters a target can run. Advisors and inspect need a Supabase
 * project; Soda needs a URL with a password, which a linked target lacks.
 * A target that can run neither is a configuration error, not a clean pass.
 */
export const auditPlan = (
  config: DbQualityConfig,
  target: AuditTarget,
): { supabase: boolean; soda: boolean; skipped: string[] } => {
  const supabase = 'linked' in target || isSupabaseHost(target.dbUrl)
  const soda = config.audit.soda !== undefined && 'dbUrl' in target
  const skipped = [
    ...(supabase
      ? []
      : ['supabase: skipped, --db-url is not a Supabase project host']),
    ...(config.audit.soda !== undefined && !soda
      ? [
          'soda: skipped, a linked target carries no database password; pass --db-url',
        ]
      : []),
  ]
  if (!supabase && !soda) {
    throw new ConfigError(
      'nothing to audit: not a Supabase host and audit.soda is not configured',
    )
  }
  return { supabase, soda, skipped }
}
