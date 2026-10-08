import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { CodegenDriverOf } from '@/adapters/kysely/drift/CodegenDriverOf.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// Runs kysely-codegen against the live database and returns the generated
// `db.d.ts` path. The URL travels only through the environment, never argv,
// because it carries a password; kysely-codegen does not echo it, but any
// stderr we surface is redacted of it anyway as a second line of defence.
// It runs from the system temporary directory: inside a project that already
// depends on kysely or pg, npx skips installing them next to kysely-codegen,
// which then cannot resolve its driver.
export const runKyselyCodegen = (
  runner: CommandRunner,
  scratch: string,
  dialect: 'postgres' | 'mysql',
  dbUrl: string,
): string => {
  const outFile = join(scratch, 'db.d.ts')
  const result = runner(
    'npx',
    [
      '--yes',
      '--package',
      'kysely-codegen@0.20.0',
      '--package',
      'kysely@0',
      '--package',
      CodegenDriverOf[dialect],
      'kysely-codegen',
      '--dialect',
      dialect,
      '--url',
      'env(CODEALITY_DB_URL)',
      '--out-file',
      outFile,
      '--log-level',
      'error',
      ...(dialect === 'postgres' ? ['--include-pattern', 'public.*'] : []),
    ],
    { cwd: tmpdir(), env: { CODEALITY_DB_URL: dbUrl } },
  )
  if (result.missing)
    throw new ToolMissingError('npx', 'install Node.js with npm')

  if (!existsSync(outFile)) {
    const tail = result.stderr
      .trim()
      .slice(0, 500)
      .replaceAll(dbUrl, '<db-url>')
    throw new Error(
      `kysely-codegen produced no types (exit ${String(result.status)}): ${tail}`,
    )
  }
  return outFile
}
