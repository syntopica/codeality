import { compileKyselyMigrations } from '@/adapters/kysely/compileKyselyMigrations.js'
import type { KyselyCompileRequest } from '@/adapters/kysely/KyselyCompileRequest.js'
import { reportCommandError } from '@syntopica/gate-kit/reportCommandError'

// Bundled to dist/kyselyCompileMain.js and run by assets/kysely-compile.mjs in
// its own process: the CLI is synchronous, Kysely is not.
/** Compiles the request in argv[0] and prints the result as JSON; 2 or 3 on failure. */
export const kyselyCompileMain = async (argv: string[]): Promise<number> => {
  try {
    const request = JSON.parse(argv[0] ?? '') as KyselyCompileRequest
    const compiled = await compileKyselyMigrations(request)
    process.stdout.write(JSON.stringify(compiled))
    return 0
  } catch (error) {
    return reportCommandError(error, (text) => process.stderr.write(text))
  }
}
