import { parseSquawkReport } from '@/adapters/squawk/parseSquawkReport.js'
import { SUPABASE_SQUAWK_EXCLUDES } from '@/adapters/squawk/SUPABASE_SQUAWK_EXCLUDES.js'
import type { Finding } from '@/model/Finding.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

export const runSquawk = (
  runner: CommandRunner,
  root: string,
  set: MigrationFile[],
  disabled: string[],
): Finding[] => {
  const result = runner(
    'squawk',
    [
      '--reporter',
      'json',
      '--exclude',
      SUPABASE_SQUAWK_EXCLUDES.join(','),
      ...set.map((f) => f.path),
    ],
    { cwd: root },
  )
  if (result.missing)
    throw new ToolMissingError('squawk', 'add squawk-cli as a devDependency')
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `squawk exited ${String(result.status)}: ${result.stderr.trim()}`,
    )
  }
  return parseSquawkReport(result.stdout, set, disabled)
}
