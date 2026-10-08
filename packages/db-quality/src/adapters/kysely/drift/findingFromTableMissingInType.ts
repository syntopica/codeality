import { kyselyDriftFinding } from '@/adapters/kysely/drift/kyselyDriftFinding.js'
import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

// One `table-missing-in-type` finding for a live table absent from the
// declared type.
export const findingFromTableMissingInType = (
  table: string,
  ref: DatabaseTypeRef,
  disabled: DisableEntry[],
): Finding[] =>
  kyselyDriftFinding({
    rule: 'table-missing-in-type',
    severity: 'error',
    path: ref.path,
    line: 0,
    message: `table "${table}" exists in the database but not in ${ref.exportName}`,
    subject: table,
    disabled,
  })
