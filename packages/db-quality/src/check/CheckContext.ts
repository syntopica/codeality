import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

export type CheckContext = {
  root: string
  config: DbQualityConfig
  runner: CommandRunner
}
