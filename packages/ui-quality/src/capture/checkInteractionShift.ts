import type { Page } from 'playwright'

import { interactionShiftFailureOf } from '@/behaviour/interactionShiftFailureOf.js'
import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { frameHeightOf } from '@/capture/frameHeightOf.js'
import { heightsAcrossOptions } from '@/capture/heightsAcrossOptions.js'
import { MAX_TOGGLE_GROUPS } from '@/capture/MAX_TOGGLE_GROUPS.js'
import { MAX_TOGGLE_OPTIONS } from '@/capture/MAX_TOGGLE_OPTIONS.js'
import { pressedIndexOf } from '@/capture/pressedIndexOf.js'
import { settlePage } from '@/capture/settlePage.js'
import { TOGGLE_GROUP } from '@/capture/TOGGLE_GROUP.js'
import { TOGGLE_OPTION } from '@/capture/TOGGLE_OPTION.js'
import { toggleGroupLabelOf } from '@/capture/toggleGroupLabelOf.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Presses every option of each toggle group in the main region and checks
 * the bar around it keeps its height, then presses the option that was on
 * before. A group whose options cannot be pressed is skipped: the click
 * rules own that failure.
 */
export const checkInteractionShift = async (
  page: Page,
  main: string,
): Promise<BehaviourFailure[]> => {
  const failures: BehaviourFailure[] = []
  const groups = page.locator(main).first().locator(TOGGLE_GROUP)
  const count = Math.min(await groups.count(), MAX_TOGGLE_GROUPS)
  for (let index = 0; index < count; index += 1) {
    const group = groups.nth(index)
    const options = group.locator(TOGGLE_OPTION)
    const total = Math.min(await options.count(), MAX_TOGGLE_OPTIONS)
    if (total < 2) continue
    const pressed = await pressedIndexOf(options, total)
    const heights = await heightsAcrossOptions(page, options, total, async () =>
      frameHeightOf(page, main, index),
    ).catch(() => [])
    await options
      .nth(pressed)
      .click({ timeout: CLICK_TIMEOUT_MS })
      .catch(() => undefined)
    await settlePage(page)
    const subject = await toggleGroupLabelOf(group, options)
    const failure = interactionShiftFailureOf(subject, heights)
    if (failure) failures.push(failure)
  }
  return failures
}
