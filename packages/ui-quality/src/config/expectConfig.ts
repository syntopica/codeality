import { ConfigError } from '@syntopica/gate-kit/ConfigError'

export const expectConfig: (
  condition: boolean,
  message: string,
) => asserts condition = (condition, message) => {
  if (!condition) throw new ConfigError(message)
}
