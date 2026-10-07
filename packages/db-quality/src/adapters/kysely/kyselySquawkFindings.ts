import { existsSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { LocatedMigration } from '@/adapters/kysely/LocatedMigration.js'
import { retargetedFinding } from '@/adapters/kysely/retargetedFinding.js'
import { writePostgresScratch } from '@/adapters/kysely/writePostgresScratch.js'
import { KYSELY_SQUAWK_EXCLUDES } from '@/adapters/squawk/KYSELY_SQUAWK_EXCLUDES.js'
import { runSquawkWith } from '@/adapters/squawk/runSquawkWith.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

// squawk runs in the scratch directory so its report names the scratch files;
// the project's node_modules is linked in, so the project's own squawk-cli is
// the one found, exactly as for a Supabase project.
/** BDB100/<rule>: squawk over each migration's compiled PostgreSQL up, reported on the migration. */
export const kyselySquawkFindings = (
  runner: CommandRunner,
  root: string,
  migrations: LocatedMigration[],
  disabled: DisableEntry[],
): Finding[] => {
  const directory = mkdtempSync(join(tmpdir(), 'codeality-db-kysely-'))
  try {
    if (existsSync(join(root, 'node_modules')))
      symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'))
    const scratch = writePostgresScratch(directory, migrations)
    if (scratch.length === 0) return []
    const findings = runSquawkWith(
      runner,
      directory,
      scratch.map((entry) => entry.file),
      { excludes: KYSELY_SQUAWK_EXCLUDES, disabled },
    )
    return findings.flatMap((finding) => {
      const migration = scratch.find(
        (entry) => entry.file.path === finding.path,
      )?.migration
      return migration
        ? [
            retargetedFinding(finding, {
              path: migration.path,
              line: migration.line,
              subject: migration.name,
              message: `postgres: ${finding.message}`,
            }),
          ]
        : []
    })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}
