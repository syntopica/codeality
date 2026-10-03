import { MIN_COLLECTION_ITEMS } from '@/capture/MIN_COLLECTION_ITEMS.js'

/**
 * Source of a function that, given the main selector, returns the identity of
 * each item of the main region's largest repeated collection: the visible
 * siblings of one tag under one parent that each carry a heading or a link
 * with words in it, which is what a card of a grid or an entry of a list is.
 * An item is known by the address of its first link, else by its heading;
 * an in-page link by its fragment alone, which every page resolves alike.
 * Navigation and tables are left out, and so are numbered pager links, which
 * carry no words. A string, because this package compiles without the DOM
 * library.
 */
export const COLLECTION_ITEMS = `(main) => {
  const region = document.querySelector(main)
  if (!region) return []
  const HEADING = 'h1, h2, h3, h4, h5, h6, [role="heading"]'
  const named = (item) =>
    item.querySelector(HEADING) !== null ||
    [...item.querySelectorAll('a[href]')].some((link) => /\\p{L}/u.test(link.textContent ?? ''))
  const identityOf = (item) => {
    const link = item.matches('a[href]') ? item : item.querySelector('a[href]')
    if (link?.getAttribute('href')?.startsWith('#')) return link.getAttribute('href')
    if (link) {
      const url = new URL(link.href, location.href)
      return url.pathname + url.search + url.hash
    }
    return (item.querySelector(HEADING)?.textContent ?? '').trim()
  }
  let best = []
  for (const parent of [region, ...region.querySelectorAll('*')]) {
    if (parent.closest('nav, table')) continue
    const groups = new Map()
    for (const child of parent.children) {
      if (child.getClientRects().length === 0 || !named(child)) continue
      const group = groups.get(child.tagName) ?? []
      group.push(child)
      groups.set(child.tagName, group)
    }
    for (const group of groups.values()) if (group.length > best.length) best = group
  }
  return best.length >= ${String(MIN_COLLECTION_ITEMS)} ? best.map(identityOf) : []
}`
