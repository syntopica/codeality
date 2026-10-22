import type { Locator, Page } from 'playwright'

import { interactionShiftFailureOf } from '@/behaviour/interactionShiftFailureOf.js'
import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { heightsAcrossOptions } from '@/capture/heightsAcrossOptions.js'
import { MAX_TOGGLE_OPTIONS } from '@/capture/MAX_TOGGLE_OPTIONS.js'
import { selectedTabIndexOf } from '@/capture/selectedTabIndexOf.js'
import { settlePage } from '@/capture/settlePage.js'
import { TAB_OPTIONS } from '@/capture/TAB_OPTIONS.js'
import { tabListHeightOf } from '@/capture/tabListHeightOf.js'
import { tabListLabelOf } from '@/capture/tabListLabelOf.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/** Exercise and restore one tab list, measuring only its own rectangle. */
export const checkTabListInteractionShift = async (
  page: Page,
  list: Locator,
): Promise<BehaviourFailure | null> => {
  const options = list.locator(TAB_OPTIONS)
  const total = Math.min(await options.count(), MAX_TOGGLE_OPTIONS)
  if (total < 2) return null
  const selected = await selectedTabIndexOf(options, await options.count())
  if (selected < 0) return null
  const heights = await heightsAcrossOptions(page, options, total, async () =>
    tabListHeightOf(list),
  ).catch(() => [])
  await options
    .nth(selected)
    .click({ timeout: CLICK_TIMEOUT_MS })
    .catch(() => undefined)
  await settlePage(page)
  const subject = await tabListLabelOf(list, options)
  return interactionShiftFailureOf(subject, heights)
}
