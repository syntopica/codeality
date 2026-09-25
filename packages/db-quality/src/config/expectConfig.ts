import { ConfigError } from '@/config/ConfigError.js'

export const expectConfig = (condition: boolean, message: string): void => {
  if (!condition) throw new ConfigError(message)
}
