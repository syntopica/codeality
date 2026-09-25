import { foreignKeyFindings } from '@/adapters/sqlite/foreignKeyFindings.js'
import { integrityFindings } from '@/adapters/sqlite/integrityFindings.js'
import { primaryKeyFindings } from '@/adapters/sqlite/primaryKeyFindings.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export const runSqliteChecks = (
  runner: CommandRunner,
  root: string,
  files: string[],
  disabled: string[],
): Finding[] =>
  files.flatMap((file) => [
    ...integrityFindings(runner, root, file, disabled),
    ...foreignKeyFindings(runner, root, file, disabled),
    ...primaryKeyFindings(runner, root, file, disabled),
  ])
