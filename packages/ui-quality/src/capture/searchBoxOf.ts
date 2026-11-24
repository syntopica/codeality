import type { Locator, Page } from 'playwright'

/** The visible table search field of the main region, by type, role or placeholder. */
export const searchBoxOf = async (
  page: Page,
  main: string,
): Promise<Locator | null> => {
  const box = page
    .locator(
      [
        'input[type="search"]',
        '[role="searchbox"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="buscar" i]',
        'input[placeholder*="filter" i]',
        'input[placeholder*="filtrar" i]',
      ]
        .map((selector) => `${main} ${selector}:not([role="combobox" i])`)
        .join(', '),
    )
    .first()
  return (await box.isVisible()) ? box : null
}
