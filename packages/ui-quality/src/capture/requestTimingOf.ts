import type { Request } from 'playwright'

import type { RequestTiming } from '@/model/RequestTiming.js'

/**
 * How long a finished request took, from its start to the last byte of its
 * response. Null when the browser kept no timing for it.
 */
export const requestTimingOf = (request: Request): RequestTiming | null => {
  const { responseEnd } = request.timing()
  if (responseEnd < 0) return null
  const url = new URL(request.url())
  return {
    method: request.method(),
    path: url.pathname + url.search,
    action: request.headers()['next-action'] ?? null,
    durationMs: Math.round(responseEnd),
  }
}
