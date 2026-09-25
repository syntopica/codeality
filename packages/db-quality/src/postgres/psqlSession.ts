import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import { psqlArguments } from '@/postgres/psqlArguments.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'
import { redactConnectionSecrets } from '@/postgres/redactConnectionSecrets.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// Every call is one psql process: the pooler ignores PGOPTIONS, so the
// read-only mode is a session SET sent before the query, every time. The
// password travels in the environment and never in an argument or a message.
export const psqlSession = (
  runner: CommandRunner,
  root: string,
  target: PostgresTarget,
  timeoutMs: number,
): PsqlSession => {
  const run = (sql: string): string => {
    const result = runner('psql', psqlArguments(target.url, timeoutMs, sql), {
      cwd: root,
      env: { PGPASSWORD: target.password ?? '', PGCONNECT_TIMEOUT: '10' },
    })
    if (result.missing)
      throw new ToolMissingError('psql', 'install the PostgreSQL client')
    if (result.status !== 0)
      throw new Error(
        `psql failed: ${redactConnectionSecrets(result.stderr.trim())}`,
      )
    return result.stdout
  }
  return {
    rows: (sql) => {
      const out = run(
        `select coalesce(json_agg(t), '[]'::json) from (${sql}) t`,
      ).trim()
      return out === '' ? [] : (JSON.parse(out) as unknown[])
    },
    text: (sql) => run(sql).trim(),
  }
}
