import type { Locator } from 'playwright'

/** How a toggle group is named in a finding: its `aria-label`, else its options' texts. */
export const toggleGroupLabelOf = async (
  group: Locator,
  options: Locator,
): Promise<string> => {
  const label = (await group.getAttribute('aria-label'))?.trim() ?? ''
  const name =
    label !== ''
      ? label
      : (await options.allInnerTexts())
          .map((text) => text.replace(/\s+/g, ' ').trim())
          .join(' / ')
  return `toggle group "${name}"`
}
