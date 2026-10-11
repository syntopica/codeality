import { join } from 'node:path'

import type { CommandIo } from '@/commands/CommandIo.js'
import type { PackageScripts } from '@/commands/PackageScripts.js'
import { hookCommands } from '@/inventory/hookCommands.js'
import { scriptsReachedFrom } from '@/inventory/scriptsReachedFrom.js'
import type { HookReach } from '@/model/HookReach.js'

/** What each git hook runs, read from lefthook.yml or .husky and package.json. */
export const hookReaches = (io: CommandIo): HookReach[] => {
  const manifest = io.readText(join(io.root, 'package.json'))
  const scripts = (JSON.parse(manifest ?? '{}') as PackageScripts).scripts ?? {}
  const lefthook =
    io.readText(join(io.root, 'lefthook.yml')) ??
    io.readText(join(io.root, 'lefthook.yaml'))
  return ['pre-commit', 'pre-push'].map((hook) => ({
    hook,
    scripts,
    reached: scriptsReachedFrom(
      hookCommands(hook, lefthook, io.readText(join(io.root, '.husky', hook))),
      scripts,
    ),
  }))
}
