import { DB_PASSWORD_ENV } from '@/postgres/DB_PASSWORD_ENV.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import type { PostgresTargetFlags } from '@/postgres/PostgresTargetFlags.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** Resolves the live target or fails with a configuration error naming both ways to supply one. */
export const requirePostgresTarget = (
  root: string,
  flags: PostgresTargetFlags,
): PostgresTarget => {
  const target = resolvePostgresTarget(root, flags)
  if (target) return target
  throw new ConfigError(
    `perf needs --db-url, or a linked project with ${DB_PASSWORD_ENV} set (the same variable the Supabase CLI reads)`,
  )
}
