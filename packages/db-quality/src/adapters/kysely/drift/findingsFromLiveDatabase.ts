import { compareSchemas } from '@/adapters/kysely/drift/compareSchemas.js'
import { findColumnTypeDrifts } from '@/adapters/kysely/drift/findColumnTypeDrifts.js'
import { findingsFromComparison } from '@/adapters/kysely/drift/findingsFromComparison.js'
import type { FindingsFromLiveDatabaseOptions } from '@/adapters/kysely/drift/FindingsFromLiveDatabaseOptions.js'
import { loadDriftSchemas } from '@/adapters/kysely/drift/loadDriftSchemas.js'
import { packageJsonPathOf } from '@/adapters/kysely/drift/packageJsonPathOf.js'
import { runKyselyCodegen } from '@/adapters/kysely/drift/runKyselyCodegen.js'
import { writeDriftProbe } from '@/adapters/kysely/drift/writeDriftProbe.js'
import type { Finding } from '@/model/Finding.js'
import { loadTypeScript } from '@/postgrest/loadTypeScript.js'

// Introspects the live database, builds both probes and compares them table
// by table and column by column, inside the given scratch directory.
export const findingsFromLiveDatabase = ({
  runner,
  root,
  scratch,
  ref,
  dialect,
  dbUrl,
  databaseTypeIgnores,
  disabled,
}: FindingsFromLiveDatabaseOptions): Finding[] => {
  runKyselyCodegen(runner, scratch, dialect, dbUrl)
  const probe = writeDriftProbe(root, scratch, ref)
  const ts = loadTypeScript(
    [packageJsonPathOf(root), import.meta.url],
    'install typescript in the project to run the Kysely type drift audit',
  )
  const { live, declared, program } = loadDriftSchemas(ts, root, probe, ref)
  const columnTypeDrift = findColumnTypeDrifts({
    ts,
    probe,
    scratch,
    live,
    declared,
    baseOptions: program.getCompilerOptions(),
  })
  const comparison = compareSchemas(
    live,
    declared,
    databaseTypeIgnores,
    columnTypeDrift,
  )
  return findingsFromComparison(comparison, root, ref, disabled)
}
