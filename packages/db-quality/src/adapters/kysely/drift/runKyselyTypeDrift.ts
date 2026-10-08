import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import { findingsFromLiveDatabase } from '@/adapters/kysely/drift/findingsFromLiveDatabase.js'
import type { RunKyselyTypeDriftOptions } from '@/adapters/kysely/drift/RunKyselyTypeDriftOptions.js'
import { codegenDialectOf } from '@/audit/codegenDialectOf.js'
import { kyselyDatabaseTypeRefFrom } from '@/config/kyselyDatabaseTypeRefFrom.js'
import type { Finding } from '@/model/Finding.js'

// Introspects the live database with kysely-codegen and compares it, table
// by table and column by column, against the project's hand-written
// Database type using the TypeScript compiler API. The scratch directory is
// created inside the project root so the probe modules resolve the
// project's own node_modules and tsconfig.
export const runKyselyTypeDrift = ({
  runner,
  root,
  kysely,
  dbUrl,
  disabled,
}: RunKyselyTypeDriftOptions): Finding[] => {
  if (kysely.databaseType === undefined) return []
  const ref = kyselyDatabaseTypeRefFrom(kysely.databaseType)
  const dialect = codegenDialectOf(dbUrl)
  if (dialect === undefined) return []

  const scratch = mkdtempSync(join(root, '.codeality-db-drift-'))
  try {
    return findingsFromLiveDatabase({
      runner,
      root,
      scratch,
      ref,
      dialect,
      dbUrl,
      databaseTypeIgnores: kysely.databaseTypeIgnores ?? [],
      disabled,
    })
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
