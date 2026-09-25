import type { CommandIo } from '@/commands/CommandIo.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { perfBenchAction } from '@/commands/perfBenchAction.js'
import { perfDiffAction } from '@/commands/perfDiffAction.js'
import { perfSnapshotAction } from '@/commands/perfSnapshotAction.js'
import { reportCommandError } from '@/commands/reportCommandError.js'
import { legacyConfigNotice } from '@/config/legacyConfigNotice.js'
import { readConfig } from '@/config/readConfig.js'
import { perfActionFrom } from '@/perf/perfActionFrom.js'
import { QUERY_TIMEOUT_MS } from '@/perf/QUERY_TIMEOUT_MS.js'
import { psqlSession } from '@/postgres/psqlSession.js'
import { requirePostgresTarget } from '@/postgres/requirePostgresTarget.js'

export const perfCommand = (argv: string[], io: CommandIo): number => {
  try {
    const { values, positionals } = parseCommandArgs(argv, {
      json: { type: 'boolean' },
      record: { type: 'boolean' },
      'db-url': { type: 'string' },
    })
    const action = perfActionFrom(positionals)
    const config = readConfig(io.root)
    const notice = legacyConfigNotice(config)
    if (notice) io.stderr(`${notice}\n`)
    const target = requirePostgresTarget(io.root, {
      'db-url': values['db-url'] as string | undefined,
    })
    const timeout =
      action === 'bench' ? config.perf.benchTimeoutMs : QUERY_TIMEOUT_MS
    const session = psqlSession(io.runner, io.root, target, timeout)
    const actionIo = {
      io,
      config,
      target,
      session,
      json: values['json'] === true,
      record: values['record'] === true,
    }
    if (action === 'snapshot') return perfSnapshotAction(actionIo)
    if (action === 'diff') return perfDiffAction(actionIo)
    return perfBenchAction(actionIo)
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
