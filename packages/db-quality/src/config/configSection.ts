import { ConfigError } from '@/config/ConfigError.js'

/** The named section as an object, undefined when absent, ConfigError when it is not an object. */
export const configSection = (
  raw: Record<string, unknown>,
  name: string,
): Record<string, unknown> | undefined => {
  const value = raw[name]
  if (value === undefined) return undefined
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ConfigError(`${name} must be an object`)
  }
  return value as Record<string, unknown>
}
