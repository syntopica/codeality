import { parsePrismaLintReport } from '@/adapters/prisma/parsePrismaLintReport.js'
import { assetPath } from '@/assetPath.js'
import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// prisma-lint writes its JSON report to stderr, and exits 1 whenever it has
// one violation to report. Both are its documented behaviour, not a bug here.
export const runPrismaLint = (
  runner: CommandRunner,
  root: string,
  schemaPath: string,
  disabled: DisableEntry[],
): Finding[] => {
  const result = runner(
    'prisma-lint',
    ['-c', assetPath('prisma-lint.json'), '-o', 'json', schemaPath],
    { cwd: root },
  )
  if (result.missing) {
    throw new ToolMissingError(
      'prisma-lint',
      'add prisma-lint as a devDependency',
    )
  }
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `prisma-lint exited ${String(result.status)}: ${result.stderr.trim()}`,
    )
  }
  return parsePrismaLintReport(result.stderr, disabled)
}
