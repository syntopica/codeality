import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { assetPath } from '@/assetPath.js'
import type { CommandIo } from '@/commands/CommandIo.js'
import { ensureGitignored } from '@/commands/ensureGitignored.js'
import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import { STATE_DIR } from '@/config/STATE_DIR.js'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'
import { reportCommandError } from '@syntopica/gate-kit/reportCommandError'

export const initCommand = async (
  _argv: string[],
  io: CommandIo,
): Promise<number> => {
  try {
    const target = join(io.root, CONFIG_FILENAME)
    if (existsSync(target)) {
      io.stdout(`${CONFIG_FILENAME} exists; left as it is\n`)
    } else {
      copyFileSync(assetPath(CONFIG_FILENAME), target)
      io.stdout(
        `wrote ${CONFIG_FILENAME}: set baseUrl and routes, then run "codeality-ui check"\n`,
      )
    }
    if (ensureGitignored(io.root))
      io.stdout(`added /${STATE_DIR}/ to .gitignore\n`)
    return await Promise.resolve(ExitCode.OK)
  } catch (error) {
    return reportCommandError(error, io.stderr)
  }
}
