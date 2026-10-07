import type { Page, Request, Response } from 'playwright'

import type { FailedImageRecorder } from '@/capture/FailedImageRecorder.js'

/**
 * Starts listing the images a page could not load: a request that failed
 * outright (a missing file, a refused connection) or was answered with 400 and
 * up. CSS backgrounds leave no trace in the DOM, so this is how they are seen.
 */
export const recordFailedImages = (page: Page): FailedImageRecorder => {
  const urls: string[] = []
  const onFailed = (request: Request): void => {
    if (request.resourceType() === 'image') urls.push(request.url())
  }
  const onResponse = (response: Response): void => {
    if (response.status() >= 400) onFailed(response.request())
  }
  page.on('requestfailed', onFailed)
  page.on('response', onResponse)
  return {
    urls,
    stop: () => {
      page.off('requestfailed', onFailed)
      page.off('response', onResponse)
    },
  }
}
