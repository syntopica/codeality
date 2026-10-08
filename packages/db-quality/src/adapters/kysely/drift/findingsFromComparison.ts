import { findingFromColumnMissingInDatabase } from '@/adapters/kysely/drift/findingFromColumnMissingInDatabase.js'
import { findingFromColumnMissingInType } from '@/adapters/kysely/drift/findingFromColumnMissingInType.js'
import { findingFromColumnTypeDrift } from '@/adapters/kysely/drift/findingFromColumnTypeDrift.js'
import { findingFromTableMissingInDatabase } from '@/adapters/kysely/drift/findingFromTableMissingInDatabase.js'
import { findingFromTableMissingInType } from '@/adapters/kysely/drift/findingFromTableMissingInType.js'
import { rootRelativeOf } from '@/adapters/kysely/drift/rootRelativeOf.js'
import type { SchemaComparison } from '@/adapters/kysely/drift/SchemaComparison.js'
import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

// Turns a schema comparison into findings, rooting every declared location
// at the project root so paths in the report are root-relative and POSIX,
// like the rest of this tool.
export const findingsFromComparison = (
  comparison: SchemaComparison,
  root: string,
  ref: DatabaseTypeRef,
  disabled: DisableEntry[],
): Finding[] => {
  const rootRelative = rootRelativeOf(root)
  const findings: Finding[] = []

  for (const table of comparison.tableMissingInType) {
    findings.push(...findingFromTableMissingInType(table, ref, disabled))
  }
  for (const entry of comparison.tableMissingInDatabase) {
    findings.push(
      ...findingFromTableMissingInDatabase(entry, rootRelative, ref, disabled),
    )
  }
  for (const entry of comparison.columnMissingInType) {
    findings.push(
      ...findingFromColumnMissingInType(entry, rootRelative, ref, disabled),
    )
  }
  for (const entry of comparison.columnMissingInDatabase) {
    findings.push(
      ...findingFromColumnMissingInDatabase(entry, rootRelative, ref, disabled),
    )
  }
  for (const drift of comparison.columnTypeDrift) {
    findings.push(
      ...findingFromColumnTypeDrift(drift, rootRelative, ref, disabled),
    )
  }

  return findings
}
