import { spawnSync } from 'node:child_process'
import { delimiter, join } from 'node:path'
import { env as processEnv } from 'node:process'

import type { CommandRunner } from '@/tools/CommandRunner.js'
import { packageBinPath } from '@/tools/packageBinPath.js'

export const spawnRunner: CommandRunner = (command, args, options) => {
  // The project's tools win; the package's own follow; the shell's PATH last.
  // A command that receives a credential resolves from the shell's PATH alone.
  const path = options.systemPathOnly
    ? (processEnv['PATH'] ?? '')
    : [
        join(options.cwd, 'node_modules/.bin'),
        packageBinPath(),
        processEnv['PATH'] ?? '',
      ].join(delimiter)
  const child = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...processEnv, ...options.env, PATH: path },
  })
  // The typings promise strings, but a spawn that never started hands back null.
  const output: { stdout: string | null; stderr: string | null } = child
  return {
    status: child.status ?? -1,
    stdout: output.stdout ?? '',
    stderr: output.stderr ?? '',
    missing:
      (child.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT',
  }
}
