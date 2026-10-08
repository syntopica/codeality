import type { AuditAdapters } from '@/audit/AuditAdapters.js'
import type { AuditTarget } from '@/audit/AuditTarget.js'
import { codegenDialectOf } from '@/audit/codegenDialectOf.js'
import { isSupabaseHost } from '@/audit/isSupabaseHost.js'
import { skippedAdapterReasons } from '@/audit/skippedAdapterReasons.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/**
 * Which live adapters a target can run. Advisors and inspect need a Supabase
 * project; Soda needs a URL with a password, which a linked target lacks;
 * the Kysely type drift audit needs a URL whose scheme kysely-codegen
 * supports. A target that can run none of the three is a configuration
 * error, not a clean pass.
 */
export const auditPlan = (
  config: DbQualityConfig,
  target: AuditTarget,
): AuditAdapters => {
  const supabase = 'linked' in target || isSupabaseHost(target.dbUrl)
  const sodaConfigured = config.audit.soda !== undefined
  const soda = sodaConfigured && 'dbUrl' in target
  const databaseTypeConfigured = config.kysely?.databaseType !== undefined
  const dialect = 'dbUrl' in target ? codegenDialectOf(target.dbUrl) : undefined
  const kysely =
    databaseTypeConfigured && 'dbUrl' in target && dialect !== undefined
  const skipped = skippedAdapterReasons({
    supabase,
    soda,
    sodaConfigured,
    databaseTypeConfigured,
    target,
    dialect,
  })
  if (!supabase && !soda && !kysely) {
    throw new ConfigError(
      'nothing to audit: not a Supabase host, audit.soda is not configured and no Kysely type drift can run',
    )
  }
  return { supabase, soda, kysely, skipped }
}
