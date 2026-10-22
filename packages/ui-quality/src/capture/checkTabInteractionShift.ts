import type { Page } from 'playwright'

import { checkTabListInteractionShift } from '@/capture/checkTabListInteractionShift.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/** Exercise tab lists within the group budget left by existing toggles. */
export const checkTabInteractionShift = async (
  page: Page,
  main: string,
  remainingGroups: number,
): Promise<BehaviourFailure[]> => {
  const failures: BehaviourFailure[] = []
  const lists = page.locator(main).first().locator('[role="tablist"]')
  const count = Math.min(await lists.count(), remainingGroups)
  for (let index = 0; index < count; index += 1) {
    const failure = await checkTabListInteractionShift(
      page,
      lists.nth(index),
    ).catch(() => null)
    if (failure) failures.push(failure)
  }
  return failures
}
