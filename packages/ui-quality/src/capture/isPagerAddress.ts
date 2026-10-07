/**
 * Whether a "next" link's address pages the current one: the same path with
 * another query (`?page=2`) or a path below it (`/artists/page/2`). The next
 * article of a blog (`/blog/b` from `/blog/a`) is neither.
 */
export const isPagerAddress = (current: string, href: string): boolean => {
  const from = new URL(current)
  const to = new URL(href, from)
  if (to.origin !== from.origin) return false
  const base = from.pathname.replace(/\/$/, '')
  return (
    to.pathname.replace(/\/$/, '') === base ||
    to.pathname.startsWith(`${base}/`)
  )
}
