import type { Locator } from 'playwright'

/** Name the tab list by its label, else the texts of its own options. */
export const tabListLabelOf = async (
  list: Locator,
  options: Locator,
): Promise<string> => {
  const label = (await list.getAttribute('aria-label'))?.trim() ?? ''
  const name =
    label !== ''
      ? label
      : (await options.allInnerTexts())
          .map((text) => text.replace(/\s+/g, ' ').trim())
          .join(' / ')
  return `tab list "${name}"`
}
