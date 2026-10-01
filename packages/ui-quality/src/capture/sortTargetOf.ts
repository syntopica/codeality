import type { Locator } from 'playwright'

/**
 * What to click to sort by a header: its button, or the header itself when
 * it declares `aria-sort`. Null for a header that does not sort.
 */
export const sortTargetOf = async (
  header: Locator,
): Promise<Locator | null> => {
  const button = header.locator('button')
  if ((await button.count()) > 0) return button.first()
  return (await header.getAttribute('aria-sort')) === null ? null : header
}
