import type { Locator } from 'playwright'

/** Locate the unique selected tab across all options; ambiguous state is -1. */
export const selectedTabIndexOf = async (
  options: Locator,
  count: number,
): Promise<number> => {
  let selected = -1
  for (let index = 0; index < count; index += 1) {
    if ((await options.nth(index).getAttribute('aria-selected')) !== 'true')
      continue
    if (selected !== -1) return -1
    selected = index
  }
  return selected
}
