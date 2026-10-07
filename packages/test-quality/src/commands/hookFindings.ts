import { join } from 'node:path'

import type { CommandIo } from '@/commands/CommandIo.js'
import type { PackageScripts } from '@/commands/PackageScripts.js'
import { hookCommands } from '@/inventory/hookCommands.js'
import { scriptsReachedFrom } from '@/inventory/scriptsReachedFrom.js'
import type { Finding } from '@/model/Finding.js'
import { hookRunsSuite } from '@/rules/hookRunsSuite.js'
import { uncachedHookLint } from '@/rules/uncachedHookLint.js'

/** What the git hooks run, read from lefthook.yml or .husky and package.json. */
export const hookFindings = (io: CommandIo): Finding[] => {
  const manifest = io.readText(join(io.root, 'package.json'))
  const scripts = (JSON.parse(manifest ?? '{}') as PackageScripts).scripts ?? {}
  const lefthook =
    io.readText(join(io.root, 'lefthook.yml')) ??
    io.readText(join(io.root, 'lefthook.yaml'))
  return ['pre-commit', 'pre-push'].flatMap((hook) => {
    const commands = hookCommands(
      hook,
      lefthook,
      io.readText(join(io.root, '.husky', hook)),
    )
    const reached = scriptsReachedFrom(commands, scripts)
    return [
      ...uncachedHookLint(reached, scripts, hook),
      ...hookRunsSuite(reached, scripts, hook),
    ]
  })
}
