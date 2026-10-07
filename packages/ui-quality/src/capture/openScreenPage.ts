import { LAYOUT_SHIFT_INIT_SCRIPT } from '@/capture/LAYOUT_SHIFT_INIT_SCRIPT.js'
import type { ScreenPage } from '@/capture/ScreenPage.js'
import type { Browser, BrowserContextOptions } from 'playwright'

/**
 * A fresh context and page with the init scripts installed before any load:
 * the layout-shift observer first, then the project's own.
 */
export const openScreenPage = async (
  browser: Browser,
  options: BrowserContextOptions,
  initScripts: string[],
): Promise<ScreenPage> => {
  const context = await browser.newContext(options)
  await context.addInitScript({ content: LAYOUT_SHIFT_INIT_SCRIPT })
  for (const content of initScripts) await context.addInitScript({ content })
  return { context, page: await context.newPage() }
}
