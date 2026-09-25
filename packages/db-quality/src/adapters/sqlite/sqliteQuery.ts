import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

export const sqliteQuery = (
  runner: CommandRunner,
  root: string,
  file: string,
  sql: string,
): string => {
  const result = runner('sqlite3', ['-json', '-readonly', file, sql], {
    cwd: root,
  })
  if (result.missing) {
    throw new ToolMissingError(
      'sqlite3',
      'install the sqlite3 command line shell',
    )
  }
  if (result.status !== 0)
    throw new Error(`sqlite3 failed on ${file}: ${result.stderr.trim()}`)
  return result.stdout
}
