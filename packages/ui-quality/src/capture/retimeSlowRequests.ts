import type { Page } from 'playwright'

import { RETIME_TIMEOUT_MS } from '@/capture/RETIME_TIMEOUT_MS.js'
import type { RequestTiming } from '@/model/RequestTiming.js'

/**
 * Times every GET slower than `maxMs` once more, after the page settled, so a
 * request slowed by a loaded machine is told apart from a slow endpoint. Only
 * GETs are repeated: anything else could write. A repeat that fails keeps the
 * first timing alone.
 */
export const retimeSlowRequests = async (
  page: Page,
  requests: RequestTiming[],
  maxMs: number,
): Promise<RequestTiming[]> => {
  const retimed: RequestTiming[] = []
  for (const request of requests) {
    if (request.method !== 'GET' || request.durationMs <= maxMs) {
      retimed.push(request)
      continue
    }
    const started = performance.now()
    const ok = await page.request
      .get(new URL(request.path, page.url()).href, {
        timeout: RETIME_TIMEOUT_MS,
      })
      .then(() => true)
      .catch(() => false)
    retimed.push(
      ok
        ? { ...request, retimedMs: Math.round(performance.now() - started) }
        : request,
    )
  }
  return retimed
}
