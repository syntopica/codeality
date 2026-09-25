import type { CommandIo } from '@/commands/CommandIo.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { reportCommandError } from '@/commands/reportCommandError.js'
import { ConfigError } from '@/config/ConfigError.js'
import { readConfig } from '@/config/readConfig.js'
import type { AdoptionPhaseNumber } from '@/init/AdoptionPhaseNumber.js'
import { adoptionPhase } from '@/init/adoptionPhase.js'
import { applyInit } from '@/init/applyInit.js'
import { planInit } from '@/init/planInit.js'
import { renderAdoptionPhase } from '@/init/renderAdoptionPhase.js'
import { renderInitPlan } from '@/init/renderInitPlan.js'
import { ExitCode } from '@/model/ExitCode.js'

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
    }
    const phase = ((): AdoptionPhaseNumber => {
      try {
        return adoptionPhase(io.root, readConfig(io.root))
      } catch {
        return 0
      }
    })()
    io.stdout(`${renderAdoptionPhase(phase)}\n`)
    return exitCode
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
