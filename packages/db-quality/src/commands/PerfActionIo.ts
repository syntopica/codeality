import type { CommandIo } from '@/commands/CommandIo.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import type { PsqlSession } from '@/postgres/PsqlSessionType.js'

/** What one `perf` action needs, resolved once by `perfCommand` and shared by the three. */
export type PerfActionIo = {
  io: CommandIo
  config: DbQualityConfig
  target: PostgresTarget
  session: PsqlSession
  json: boolean
  record: boolean
}
