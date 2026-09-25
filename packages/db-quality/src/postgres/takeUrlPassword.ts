import { ConfigError } from '@/config/ConfigError.js'

/**
 * Removes the password from `url`, whether in the user info or in a
 * `?password=` parameter, and returns it decoded; undefined when there is none.
 */
export const takeUrlPassword = (
  url: URL,
  source: string,
): string | undefined => {
  const query = url.searchParams.get('password') ?? undefined
  url.searchParams.delete('password')
  const encoded = url.password
  url.password = ''
  if (!encoded) return query
  try {
    return decodeURIComponent(encoded)
  } catch {
    throw new ConfigError(`${source} password is not valid percent-encoding`)
  }
}
