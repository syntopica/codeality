import type { ScreenPage } from '@/capture/ScreenPage.js'
import type { Browser, BrowserContextOptions } from 'playwright'

/** A fresh context and page with the init scripts installed before any load. */
export const openScreenPage = async (
  browser: Browser,
  options: BrowserContextOptions,
  initScripts: string[],
): Promise<ScreenPage> => {
  const context = await browser.newContext(options)
  for (const content of initScripts) await context.addInitScript({ content })
  return { context, page: await context.newPage() }
}
