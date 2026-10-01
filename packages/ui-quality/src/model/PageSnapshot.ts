import type { AxeViolation } from '@/model/AxeViolation.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import type { RequestTiming } from '@/model/RequestTiming.js'
import type { Screen } from '@/model/Screen.js'

/** Everything the rules read about one screen. */
export type PageSnapshot = ProbeResult & {
  screen: Screen
  axe: AxeViolation[]
  screenshot: string
  /** Console errors and uncaught exceptions logged while the page loaded. */
  consoleErrors: string[]
  /** The configured clicks that found nothing to click, with the reason. */
  clickFailures: string[]
  /** Data requests the page made while it loaded, with their durations. */
  requests: RequestTiming[]
  /** What sorting and searching the main table got wrong; empty when not exercised. */
  behaviour: BehaviourFailure[]
}
