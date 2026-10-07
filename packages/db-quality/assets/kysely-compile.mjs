// Run by codeality-db in its own process, from the consumer's project
// directory, with one JSON argument: the CLI is synchronous and Kysely is not.
// Prints the compiled migrations as JSON on stdout.
import { kyselyCompileMain } from '../dist/kyselyCompileMain.js'

const code = await kyselyCompileMain(process.argv.slice(2))
// A migrations module may open a pool at import time and keep the process
// alive; exit once the report has been flushed.
process.stdout.write('', () => process.exit(code))
