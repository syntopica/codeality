import type { Locator, Page } from 'playwright'

/**
 * The first visible, enabled button or link of the main region named `name`,
 * or a link that declares the step with `rel` (`next`, `prev`) whatever its
 * name: an icon pager labels its links for screen readers alone.
 */
export const pageControlOf = async (
  page: Page,
  main: string,
  name: RegExp,
  rel: string,
): Promise<Locator | null> => {
  const region = page.locator(main)
  const control = region
    .getByRole('button', { name })
    .or(region.getByRole('link', { name }))
    .or(region.locator(`a[href][rel~="${rel}" i]`))
    .first()
  if (!(await control.isVisible())) return null
  return (await control.isEnabled()) ? control : null
}
