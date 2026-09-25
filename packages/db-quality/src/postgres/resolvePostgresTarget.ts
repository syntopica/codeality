import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { env } from 'node:process'

import { DB_PASSWORD_ENV } from '@/postgres/DB_PASSWORD_ENV.js'
import { POOLER_URL_FILE } from '@/postgres/POOLER_URL_FILE.js'
import type { PostgresTarget } from '@/postgres/PostgresTarget.js'
import type { PostgresTargetFlags } from '@/postgres/PostgresTargetFlags.js'
import { targetFromUrl } from '@/postgres/targetFromUrl.js'

/** --db-url first; then the linked pooler url with the password from the environment; undefined when neither applies. */
export const resolvePostgresTarget = (
  root: string,
  flags: PostgresTargetFlags,
): PostgresTarget | undefined => {
  const explicit = flags['db-url']
  if (explicit !== undefined) return targetFromUrl(explicit, '--db-url')
  const poolerPath = join(root, POOLER_URL_FILE)
  const password = env[DB_PASSWORD_ENV]
  if (!existsSync(poolerPath) || password === undefined || password === '')
    return undefined
  return targetFromUrl(
    readFileSync(poolerPath, 'utf8').trim(),
    POOLER_URL_FILE,
    password,
  )
}
