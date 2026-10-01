import type { AxeViolation } from '@/model/AxeViolation.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
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
}
