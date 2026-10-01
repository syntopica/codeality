import { ConfigError } from '@syntopica/gate-kit/ConfigError'

export const expectConfig = (condition: boolean, message: string): void => {
  if (!condition) throw new ConfigError(message)
}
