import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'

import { axeViolationsOf } from '@/capture/axeViolationsOf.js'
import type { ScreenRequest } from '@/capture/ScreenRequest.js'
import { screenshotName } from '@/capture/screenshotName.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'
import type { ProbeResult } from '@/model/ProbeResult.js'

/** Loads one route in an open page and measures it. */
export const captureScreen = async ({
  page,
  url,
  route,
  screen,
  screensDir,
  probe,
}: ScreenRequest): Promise<PageSnapshot> => {
  await page.goto(url, { waitUntil: 'networkidle' })
  if (route.waitFor) await page.locator(route.waitFor).first().waitFor()
  // A string, because this package compiles without the DOM library.
  await page.evaluate('document.fonts.ready.then(() => true)')
  const screenshot = join(screensDir, screenshotName(screen))
  await page.screenshot({ path: screenshot, fullPage: true })
  const axe = axeViolationsOf(await new AxeBuilder({ page }).analyze())
  const probed: ProbeResult = await page.evaluate(
    `(${probe})(${JSON.stringify(route.main)})`,
  )
  return { ...probed, screen, axe, screenshot }
}
