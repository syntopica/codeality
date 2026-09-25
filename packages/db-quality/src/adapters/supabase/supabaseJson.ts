import { parseCliError } from '@/adapters/supabase/parseCliError.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

/**
 * Runs one Supabase CLI command that answers with a JSON document and returns
 * that document's text. The CLI reports its own failures, an expired login or
 * a project of another account among them, as a `{"_tag":"Error"}` document.
 */
export const supabaseJson = (
  runner: CommandRunner,
  root: string,
  args: string[],
  label: string,
): string => {
  const result = runner('supabase', args, { cwd: root })
  if (result.missing)
    throw new ToolMissingError('supabase', 'install the Supabase CLI')
  const failure = parseCliError(`${result.stdout}\n${result.stderr}`)
  if (failure || result.status !== 0) {
    const code = failure?.code ?? String(result.status)
    throw new Error(
      `${label} failed: ${code}: ${failure?.message ?? result.stderr.trim()}`,
    )
  }
  return result.stdout.slice(result.stdout.indexOf('{'))
}
