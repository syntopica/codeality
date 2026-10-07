/**
 * Whether an address belongs to the site under test: the same origin over
 * http(s), or a path under the base for a `file:` site. A sitemap index is
 * remote content, so a child it names elsewhere (a local file, an internal
 * host) is never fetched.
 */
export const isOnSite = (address: string, baseUrl: string): boolean => {
  try {
    const target = new URL(address)
    const base = new URL(baseUrl)
    if (target.protocol !== base.protocol) return false
    if (base.protocol === 'file:') return address.startsWith(`${baseUrl}/`)
    return target.origin === base.origin
  } catch {
    return false
  }
}
