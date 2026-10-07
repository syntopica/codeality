import { recordKyselyHashes } from '@/adapters/kysely/recordKyselyHashes.js'
import type { BaselineAction } from '@/baseline/BaselineAction.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'

/** `baseline create|update` records the Kysely migration hashes before the findings. */
export const recordKyselyStep = (
  io: CommandIo,
  config: DbQualityConfig,
  action: BaselineAction,
  acceptEdits: string[],
): void => {
  if (action === 'check') return
  const recorded = recordKyselyHashes(io.runner, io.root, config, acceptEdits)
  if (recorded) io.stdout(`${recorded}\n`)
}
