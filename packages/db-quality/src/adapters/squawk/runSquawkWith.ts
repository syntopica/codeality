import { parseSquawkReport } from '@/adapters/squawk/parseSquawkReport.js'
import type { SquawkRun } from '@/adapters/squawk/SquawkRun.js'
import type { Finding } from '@/model/Finding.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

/** squawk over the migration set from `cwd`, with the run's excludes. */
export const runSquawkWith = (
  runner: CommandRunner,
  cwd: string,
  set: MigrationFile[],
  run: SquawkRun,
): Finding[] => {
  const result = runner(
    'squawk',
    [
      '--reporter',
      'json',
      '--exclude',
      run.excludes.join(','),
      ...set.map((f) => f.path),
    ],
    { cwd },
  )
  if (result.missing)
    throw new ToolMissingError('squawk', 'add squawk-cli as a devDependency')
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `squawk exited ${String(result.status)}: ${result.stderr.trim()}`,
    )
  }
  return parseSquawkReport(result.stdout, set, run.disabled)
}
