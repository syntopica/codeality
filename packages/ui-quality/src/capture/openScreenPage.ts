import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
} from 'playwright'

/** A fresh context and page with the init scripts installed before any load. */
export const openScreenPage = async (
  browser: Browser,
  options: BrowserContextOptions,
  initScripts: string[],
): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await browser.newContext(options)
  for (const content of initScripts) await context.addInitScript({ content })
  return { context, page: await context.newPage() }
}
