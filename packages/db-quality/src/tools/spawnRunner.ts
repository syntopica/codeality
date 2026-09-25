import { spawnSync } from 'node:child_process'
import { delimiter, join } from 'node:path'
import { env as processEnv } from 'node:process'

import type { CommandRunner } from '@/tools/CommandRunner.js'

export const spawnRunner: CommandRunner = (command, args, options) => {
  const path = [
    join(options.cwd, 'node_modules/.bin'),
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
