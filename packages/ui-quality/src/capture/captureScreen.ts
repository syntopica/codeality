import { auditAccessibility } from '@/capture/auditAccessibility.js'
import { checkAction } from '@/capture/checkAction.js'
import { exerciseScreen } from '@/capture/exerciseScreen.js'
import { fileDigest } from '@/capture/fileDigest.js'
import { interactWithRoute } from '@/capture/interactWithRoute.js'
import { openRouteFresh } from '@/capture/openRouteFresh.js'
import { recordConsoleErrors } from '@/capture/recordConsoleErrors.js'
import { recordFailedImages } from '@/capture/recordFailedImages.js'
import { recordRequests } from '@/capture/recordRequests.js'
import { retimeSlowRequests } from '@/capture/retimeSlowRequests.js'
import type { ScreenRequest } from '@/capture/ScreenRequest.js'
import { screenshotPage } from '@/capture/screenshotPage.js'
import { holdsState } from '@/config/holdsState.js'
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
  slowRequestMs,
  axe: axeConfig,
  ...request
}: ScreenRequest): Promise<PageSnapshot> => {
  const consoleLog = recordConsoleErrors(page)
  const requestLog = recordRequests(page)
  const imageLog = recordFailedImages(page)
  const layoutShift = await openRouteFresh(page, route, request)
  const interactionFailures = await interactWithRoute(page, route)
  const keep = holdsState(route)
  const screenshot = await screenshotPage(page, screensDir, screen, keep)
  // axe fetches each stylesheet itself to read the CSSOM; a page whose CSP
  // keeps connect-src narrow logs that refusal, which the page never caused.
  const loggedBeforeAxe = consoleLog.errors.length
  const axe = await auditAccessibility(page, axeConfig)
  consoleLog.errors.splice(loggedBeforeAxe)
  const probed: ProbeResult = await page.evaluate(
    `(${probe})(${JSON.stringify(route.main)})`,
  )
  imageLog.stop()
  const behaviour = exercise ? await exerciseScreen(page, route.main) : []
  consoleLog.stop()
  requestLog.stop()
  // After the recorders stop: the failures it injects are not the site's.
  const actions = exercise
    ? await checkAction(page, route.main).catch(() => [])
    : []
  const requests = await retimeSlowRequests(
    page,
    requestLog.requests,
    slowRequestMs,
  )
  return {
    ...probed,
    screen,
    axe,
    screenshot,
    screenshotDigest: fileDigest(screenshot),
    consoleErrors: consoleLog.errors,
    interactionFailures,
    requests,
    behaviour: [...behaviour, ...actions],
    layoutShift,
    failedImages: imageLog.urls,
  }
}
