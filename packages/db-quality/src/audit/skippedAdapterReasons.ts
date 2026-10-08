import type { SkippedAdapterReasonsOptions } from '@/audit/SkippedAdapterReasonsOptions.js'

// Builds the human-readable list of reasons each inapplicable adapter was
// skipped for this target, so the report explains itself instead of just
// going quiet.
export const skippedAdapterReasons = ({
  supabase,
  soda,
  sodaConfigured,
  databaseTypeConfigured,
  target,
  dialect,
}: SkippedAdapterReasonsOptions): string[] => [
  ...(supabase
    ? []
    : ['supabase: skipped, --db-url is not a Supabase project host']),
  ...(sodaConfigured && !soda
    ? [
        'soda: skipped, a linked target carries no database password; pass --db-url',
      ]
    : []),
  ...(databaseTypeConfigured && !('dbUrl' in target)
    ? [
        'kysely type drift: skipped, a linked target carries no database URL; pass --db-url',
      ]
    : []),
  ...(databaseTypeConfigured && 'dbUrl' in target && dialect === undefined
    ? [
        `kysely type drift: skipped, ${new URL(target.dbUrl).protocol.replace(/:$/, '')} is not a postgres or mysql URL`,
      ]
    : []),
]
