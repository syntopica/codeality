import type { Page, Request } from 'playwright'

import { DATA_RESOURCE_TYPES } from '@/capture/DATA_RESOURCE_TYPES.js'
import type { RequestRecorder } from '@/capture/RequestRecorder.js'
import { requestTimingOf } from '@/capture/requestTimingOf.js'

/** Starts timing the data requests a page makes. */
export const recordRequests = (page: Page): RequestRecorder => {
  const requests: RequestRecorder['requests'] = []
  const onFinished = (request: Request): void => {
    if (!DATA_RESOURCE_TYPES.has(request.resourceType())) return
    const timing = requestTimingOf(request)
    if (timing) requests.push(timing)
  }
  page.on('requestfinished', onFinished)
  return {
    requests,
    stop: () => {
      page.off('requestfinished', onFinished)
    },
  }
}
