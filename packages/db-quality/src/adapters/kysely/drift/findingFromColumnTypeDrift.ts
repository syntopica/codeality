import type { ColumnTypeDrift } from '@/adapters/kysely/drift/ColumnTypeDrift.js'
import { kyselyDriftFinding } from '@/adapters/kysely/drift/kyselyDriftFinding.js'
import type { RootRelative } from '@/adapters/kysely/drift/RootRelative.js'
import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

// One `column-type-drift` finding for a shared column whose live SELECT
// type does not satisfy the declared one.
export const findingFromColumnTypeDrift = (
  drift: ColumnTypeDrift,
  rootRelative: RootRelative,
  ref: DatabaseTypeRef,
  disabled: DisableEntry[],
): Finding[] =>
  kyselyDriftFinding({
    rule: 'column-type-drift',
    severity: 'error',
    path: rootRelative(drift.property.path),
    line: drift.property.line,
    message: `"${drift.table}.${drift.column}" reads as ${drift.liveType} from the database, which ${ref.exportName} declares as ${drift.declaredType}`,
    subject: `${drift.table}.${drift.column}`,
    disabled,
  })
