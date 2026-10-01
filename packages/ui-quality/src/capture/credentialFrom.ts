import { env } from 'node:process'

import { ConfigError } from '@syntopica/gate-kit/ConfigError'

export const credentialFrom = (name: string): string => {
  const value = env[name]
  if (!value) throw new ConfigError(`environment variable ${name} is not set`)
  return value
}
