import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { KYSELY_HASH_FILENAME } from '@/adapters/kysely/KYSELY_HASH_FILENAME.js'
import type { KyselyHashFile } from '@/adapters/kysely/KyselyHashFile.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** The released-migration hashes, or undefined before the first `baseline create`. */
export const readKyselyHashFile = (
  root: string,
): KyselyHashFile | undefined => {
  const path = join(root, KYSELY_HASH_FILENAME)
  if (!existsSync(path)) return undefined
  try {
    const document = JSON.parse(readFileSync(path, 'utf8')) as KyselyHashFile
    if (typeof document.migrations !== 'object')
      throw new Error('no migrations')
    return document
  } catch (error) {
    throw new ConfigError(
      `${KYSELY_HASH_FILENAME} is not valid: ${(error as Error).message}`,
    )
  }
}
