import type { AxeViolation } from '@/model/AxeViolation.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'
import type { InteractionFailure } from '@/model/InteractionFailure.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import type { RequestTiming } from '@/model/RequestTiming.js'
import type { Screen } from '@/model/Screen.js'

/** Everything the rules read about one screen. */
export type PageSnapshot = ProbeResult & {
  screen: Screen
  axe: AxeViolation[]
  screenshot: string
  /** SHA-256 of the screenshot, to tell two schemes that rendered alike. */
  screenshotDigest: string
  /** Console errors and uncaught exceptions logged while the page loaded. */
  consoleErrors: string[]
  /** The configured clicks, scrolls, hovers and focuses that found no target. */
  interactionFailures: InteractionFailure[]
  /** Data requests the page made while it loaded, with their durations. */
  requests: RequestTiming[]
  /** What sorting and searching the main table got wrong; empty when not exercised. */
  behaviour: BehaviourFailure[]
  /** Cumulative layout shift from navigation until the page settled, input-driven shifts aside. */
  layoutShift: number
  /** Addresses of images whose request failed or answered 400 and up while the page loaded. */
  failedImages: string[]
}
