import { ConfigError } from '@/config/ConfigError.js'

/** `raw` as a URL, or a ConfigError naming where it came from. */
export const parsedUrl = (raw: string, source: string): URL => {
  try {
    return new URL(raw)
  } catch {
    throw new ConfigError(`${source} is not a valid url`)
  }
}
