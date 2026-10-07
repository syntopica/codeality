import type { CommandIo } from '@/commands/CommandIo.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { readConfig } from '@/config/readConfig.js'
import { adoptionStanding } from '@/init/adoptionStanding.js'
import { applyInit } from '@/init/applyInit.js'
import { planInit } from '@/init/planInit.js'
import { renderAdoptionPhase } from '@/init/renderAdoptionPhase.js'
import { renderInitPlan } from '@/init/renderInitPlan.js'
import { writtenPaths } from '@/init/writtenPaths.js'
import { runProjectPrettier } from '@/tools/runProjectPrettier.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'
import { parseCommandArgs } from '@syntopica/gate-kit/parseCommandArgs'
import { reportCommandError } from '@syntopica/gate-kit/reportCommandError'

export const initCommand = (argv: string[], io: CommandIo): number => {
  try {
    const { values } = parseCommandArgs(argv, {
      check: { type: 'boolean' },
      apply: { type: 'boolean' },
      force: { type: 'boolean' },
    })
    const force = values['force'] === true
    const plan = planInit(io.root, force)
    io.stdout(`${renderInitPlan(plan)}\n`)
    let exitCode: number = ExitCode.OK
    if (values['check'] === true) {
      exitCode = plan.every((file) => file.disposition === 'unchanged')
        ? ExitCode.OK
        : ExitCode.FINDINGS
    } else if (values['apply'] === true || force) {
      if (plan.some((file) => file.disposition === 'conflict')) {
        throw new ConfigError('conflicts remain; resolve them or pass --force')
      }
      applyInit(io.root, plan)
      runProjectPrettier(io.runner, io.root, writtenPaths(plan))
    }
    const config = ((): DbQualityConfig | undefined => {
      try {
        return readConfig(io.root)
      } catch {
        return undefined
      }
    })()
    const standing = config
      ? adoptionStanding({ root: io.root, config, runner: io.runner })
      : { phase: 0 as const }
    io.stdout(`${renderAdoptionPhase(standing)}\n`)
    return exitCode
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
