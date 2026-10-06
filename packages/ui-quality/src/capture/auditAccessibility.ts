import AxeBuilder from '@axe-core/playwright'
import type { Page } from 'playwright'

import { axeTimeoutViolation } from '@/capture/axeTimeoutViolation.js'
import { axeViolationsOf } from '@/capture/axeViolationsOf.js'
import { raceTimeout } from '@/capture/raceTimeout.js'
import { SCRIPTLESS_SANDBOXED_FRAMES } from '@/capture/SCRIPTLESS_SANDBOXED_FRAMES.js'
import type { AxeConfig } from '@/config/AxeConfig.js'
import type { AxeViolation } from '@/model/AxeViolation.js'

/**
 * The page's axe violations, leaving out the frames axe cannot enter and the
 * configured selectors. An audit that outlives the timeout becomes one
 * finding instead of a run that never ends.
 */
export const auditAccessibility = async (
  page: Page,
  axe: AxeConfig,
): Promise<AxeViolation[]> => {
  const builder = new AxeBuilder({ page }).exclude(SCRIPTLESS_SANDBOXED_FRAMES)
  for (const selector of axe.exclude) builder.exclude(selector)
  return raceTimeout(
    (async () => axeViolationsOf(await builder.analyze()))(),
    axe.timeoutMs,
    () => [axeTimeoutViolation(axe.timeoutMs)],
  )
}
