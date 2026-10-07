import type { CompiledMigration } from '@/adapters/kysely/CompiledMigration.js'
import type { KyselyCompileRequest } from '@/adapters/kysely/KyselyCompileRequest.js'
import { assetPath } from '@/assetPath.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** The project's migrations compiled per dialect, by the compiler process; its exit 2 is a ConfigError. */
export const runKyselyCompile = (
  runner: CommandRunner,
  request: KyselyCompileRequest,
): CompiledMigration[] => {
  const result = runner(
    process.execPath,
    [assetPath('kysely-compile.mjs'), JSON.stringify(request)],
    { cwd: request.root },
  )
  const reason = result.stderr.trim()
  if (result.status === 2)
    throw new ConfigError(reason.replace(/^configuration error: /, ''))
  if (result.status !== 0)
    throw new Error(
      `the Kysely migration compiler exited ${String(result.status)}: ${reason}`,
    )
  try {
    return JSON.parse(result.stdout) as CompiledMigration[]
  } catch {
    throw new Error(
      `the Kysely migration compiler printed no JSON: ${result.stdout.slice(0, 200)}`,
    )
  }
}
