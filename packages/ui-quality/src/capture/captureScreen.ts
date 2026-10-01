import AxeBuilder from '@axe-core/playwright'

import { axeViolationsOf } from '@/capture/axeViolationsOf.js'
import { checkAction } from '@/capture/checkAction.js'
import { clickThrough } from '@/capture/clickThrough.js'
import { exerciseScreen } from '@/capture/exerciseScreen.js'
import { openRoute } from '@/capture/openRoute.js'
import { recordConsoleErrors } from '@/capture/recordConsoleErrors.js'
import { recordRequests } from '@/capture/recordRequests.js'
import type { ScreenRequest } from '@/capture/ScreenRequest.js'
import { screenshotPage } from '@/capture/screenshotPage.js'
import { storageInitScript } from '@/capture/storageInitScript.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'
import type { ProbeResult } from '@/model/ProbeResult.js'

/** Loads one route in an open page and measures it. */
export const captureScreen = async ({
  page,
  route,
  screen,
  screensDir,
  probe,
  exercise,
  ...request
}: ScreenRequest): Promise<PageSnapshot> => {
  const consoleLog = recordConsoleErrors(page)
  const requestLog = recordRequests(page)
  if (Object.keys(route.localStorage).length > 0)
    await page.addInitScript(
      storageInitScript(request.baseUrl + route.path, route.localStorage),
    )
  await openRoute(page, route.path, request)
  if (route.waitFor) await page.locator(route.waitFor).first().waitFor()
  const clickFailures = await clickThrough(page, route.click)
  const screenshot = await screenshotPage(page, screensDir, screen)
  const axe = axeViolationsOf(await new AxeBuilder({ page }).analyze())
  const probed: ProbeResult = await page.evaluate(
    `(${probe})(${JSON.stringify(route.main)})`,
  )
  const behaviour = exercise ? await exerciseScreen(page, route.main) : []
  consoleLog.stop()
  requestLog.stop()
  // After the recorders stop: the failures it injects are not the site's.
  const actions = exercise
    ? await checkAction(page, route.main).catch(() => [])
    : []
  return {
    ...probed,
    screen,
    axe,
    screenshot,
    consoleErrors: consoleLog.errors,
    clickFailures,
    requests: requestLog.requests,
    behaviour: [...behaviour, ...actions],
  }
}
