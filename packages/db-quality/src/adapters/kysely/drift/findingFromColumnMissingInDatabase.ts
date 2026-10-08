import { kyselyDriftFinding } from '@/adapters/kysely/drift/kyselyDriftFinding.js'
import type { RootRelative } from '@/adapters/kysely/drift/RootRelative.js'
import type { SchemaComparison } from '@/adapters/kysely/drift/SchemaComparison.js'
import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

// One `column-missing-in-database` finding for a declared column absent
// from the database.
export const findingFromColumnMissingInDatabase = (
  entry: SchemaComparison['columnMissingInDatabase'][number],
  rootRelative: RootRelative,
  ref: DatabaseTypeRef,
  disabled: DisableEntry[],
): Finding[] =>
  kyselyDriftFinding({
    rule: 'column-missing-in-database',
    severity: 'error',
    path: rootRelative(entry.property.path),
    line: entry.property.line,
    message: `column "${entry.column}" of table "${entry.table}" is declared in ${ref.exportName} but does not exist in the database`,
    subject: `${entry.table}.${entry.column}`,
    disabled,
  })
