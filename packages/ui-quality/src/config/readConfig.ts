import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

export const readConfig = (root: string): UiQualityConfig => {
  const path = join(root, CONFIG_FILENAME)
  if (!existsSync(path)) {
    throw new ConfigError(
      `${CONFIG_FILENAME} not found in ${root}; run "codeality-ui init"`,
    )
  }
  let document: unknown
  try {
    document = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new ConfigError(
      `${CONFIG_FILENAME} is not valid JSON: ${(error as Error).message}`,
    )
  }
  return configFromDocument(document)
}
