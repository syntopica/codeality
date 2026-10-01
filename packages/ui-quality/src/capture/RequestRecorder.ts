import type { RequestTiming } from '@/model/RequestTiming.js'

/** Data requests gathered from one page until `stop` is called. */
export type RequestRecorder = {
  requests: RequestTiming[]
  stop: () => void
}
