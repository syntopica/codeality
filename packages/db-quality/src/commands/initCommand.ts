import type { CommandIo } from '@/commands/CommandIo.js'
import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { reportCommandError } from '@/commands/reportCommandError.js'
import { ConfigError } from '@/config/ConfigError.js'
import { applyInit } from '@/init/applyInit.js'
import { planInit } from '@/init/planInit.js'
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
    if (values['check'] === true) {
      return plan.every((file) => file.disposition === 'unchanged')
        ? ExitCode.OK
        : ExitCode.FINDINGS
    }
    if (values['apply'] !== true && !force) return ExitCode.OK
    if (plan.some((file) => file.disposition === 'conflict')) {
      throw new ConfigError('conflicts remain; resolve them or pass --force')
    }
    applyInit(io.root, plan)
    return ExitCode.OK
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
