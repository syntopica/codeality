import { captureScreen } from '@/capture/captureScreen.js'
import { isFatalCaptureError } from '@/capture/isFatalCaptureError.js'
import { parkPage } from '@/capture/parkPage.js'
import type { ScreenRequest } from '@/capture/ScreenRequest.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'

/**
 * Captures a screen, trying once more when the first attempt fails for a
 * reason of its own. A 66-route run died at route 31 on
 * `page.goto: net::ERR_ABORTED` (the dev server reloaded mid-navigation) and
 * reported nothing for the 30 it had measured. Returns the second error's
 * message when both attempts fail; fatal errors are rethrown.
 * Each failure parks the page on about:blank so the next attempt, or the
 * next route, starts from a page no navigation is still landing on.
 */
export const captureWithRetry = async (
  request: ScreenRequest,
): Promise<PageSnapshot | string> => {
  let message = ''
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await captureScreen(request)
    } catch (error) {
      if (isFatalCaptureError(request.page, error)) throw error
      message = error instanceof Error ? error.message : String(error)
      await parkPage(request.page)
    }
  }
  return message
}
