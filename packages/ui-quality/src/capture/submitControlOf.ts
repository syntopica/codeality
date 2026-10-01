import type { Locator, Page } from 'playwright'

/** The first visible, enabled submit button of a form in the main region. */
export const submitControlOf = async (
  page: Page,
  main: string,
): Promise<Locator | null> => {
  const control = page
    .locator(
      `${main} form :is(button[type="submit"], button:not([type]), input[type="submit"]):visible`,
    )
    .first()
  if ((await control.count()) === 0) return null
  return (await control.isEnabled()) ? control : null
}
