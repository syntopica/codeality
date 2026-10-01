import type { Locator, Page } from 'playwright'

/** The first visible, enabled button or link of the main region named `name`. */
export const pageControlOf = async (
  page: Page,
  main: string,
  name: RegExp,
): Promise<Locator | null> => {
  const region = page.locator(main)
  const control = region
    .getByRole('button', { name })
    .or(region.getByRole('link', { name }))
    .first()
  if (!(await control.isVisible())) return null
  return (await control.isEnabled()) ? control : null
}
