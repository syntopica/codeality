import type { Locator } from 'playwright'

/** The first of `count` options showing `aria-pressed="true"`, else the first. */
export const pressedIndexOf = async (
  options: Locator,
  count: number,
): Promise<number> => {
  for (let index = 0; index < count; index += 1) {
    if ((await options.nth(index).getAttribute('aria-pressed')) === 'true')
      return index
  }
  return 0
}
