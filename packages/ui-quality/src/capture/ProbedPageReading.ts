import type { FocusStop } from '@/model/FocusStop.js'
import type { InputIcon } from '@/model/InputIcon.js'
import type { MotionRecord } from '@/model/MotionRecord.js'

/** What is read off a page after the probe, by using it. */
export type ProbedPageReading = {
  focusStops: FocusStop[]
  freeAnimations: MotionRecord[]
  inputIcons: InputIcon[]
}
