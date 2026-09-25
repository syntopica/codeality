import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import { ConfigError } from '@/config/ConfigError.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'
import { configFromDocument } from '@/config/configFromDocument.js'

export const readConfig = (root: string): DbQualityConfig => {
  const path = join(root, CONFIG_FILENAME)
  if (!existsSync(path)) {
    throw new ConfigError(
      `${CONFIG_FILENAME} not found in ${root}; run "codeality-db init"`,
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
