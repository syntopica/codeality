import { kyselyDriftFinding } from '@/adapters/kysely/drift/kyselyDriftFinding.js'
import type { RootRelative } from '@/adapters/kysely/drift/RootRelative.js'
import type { SchemaComparison } from '@/adapters/kysely/drift/SchemaComparison.js'
import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

// One `column-missing-in-type` finding for a live column absent from the
// declared type.
export const findingFromColumnMissingInType = (
  entry: SchemaComparison['columnMissingInType'][number],
  rootRelative: RootRelative,
  ref: DatabaseTypeRef,
  disabled: DisableEntry[],
): Finding[] =>
  kyselyDriftFinding({
    rule: 'column-missing-in-type',
    severity: 'error',
    path: rootRelative(entry.property.path),
    line: entry.property.line,
    message: `column "${entry.column}" of table "${entry.table}" exists in the database but not in ${ref.exportName}`,
    subject: `${entry.table}.${entry.column}`,
    disabled,
  })
