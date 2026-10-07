import type { Page } from 'playwright'

import { auditAccessibility } from '@/capture/auditAccessibility.js'
import type { ConsoleRecorder } from '@/capture/ConsoleRecorder.js'
import type { AxeConfig } from '@/config/AxeConfig.js'
import type { AxeViolation } from '@/model/AxeViolation.js'

/**
 * Runs axe and forgets the console errors it caused: axe fetches each
 * stylesheet itself to read the CSSOM, and a page whose CSP keeps connect-src
 * narrow logs that refusal, which the page never caused.
 */
export const auditWithoutConsoleNoise = async (
  page: Page,
  config: AxeConfig,
  consoleLog: ConsoleRecorder,
): Promise<AxeViolation[]> => {
  const loggedBeforeAxe = consoleLog.errors.length
  const axe = await auditAccessibility(page, config)
  consoleLog.errors.splice(loggedBeforeAxe)
  return axe
}
