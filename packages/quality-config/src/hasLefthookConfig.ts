import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { LEFTHOOK_CONFIG_FILES } from './LEFTHOOK_CONFIG_FILES'

/** Whether `cwd` has a configuration file knip's Lefthook plugin reads. */
export const hasLefthookConfig = (cwd: string): boolean =>
  LEFTHOOK_CONFIG_FILES.some((file) =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed file names under the project root
    existsSync(join(cwd, file)),
  )
