import { kyselyDriftFinding } from '@/adapters/kysely/drift/kyselyDriftFinding.js'
import type { RootRelative } from '@/adapters/kysely/drift/RootRelative.js'
import type { SchemaComparison } from '@/adapters/kysely/drift/SchemaComparison.js'
import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

// One `table-missing-in-database` finding for a declared table absent from
// the database.
export const findingFromTableMissingInDatabase = (
  entry: SchemaComparison['tableMissingInDatabase'][number],
  rootRelative: RootRelative,
  ref: DatabaseTypeRef,
  disabled: DisableEntry[],
): Finding[] =>
  kyselyDriftFinding({
    rule: 'table-missing-in-database',
    severity: 'error',
    path: rootRelative(entry.property.path),
    line: entry.property.line,
    message: `table "${entry.table}" is declared in ${ref.exportName} but does not exist in the database`,
    subject: entry.table,
    disabled,
  })
