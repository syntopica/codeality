import type { Locator, Page } from 'playwright'

/**
 * The visible link of the main region named "2": a numbered pager with no
 * "next" control still links its second page.
 */
export const pageTwoLinkOf = async (
  page: Page,
  main: string,
): Promise<Locator | null> => {
  const link = page
    .locator(main)
    .getByRole('link', { name: '2', exact: true })
    .first()
  return (await link.isVisible()) ? link : null
}
