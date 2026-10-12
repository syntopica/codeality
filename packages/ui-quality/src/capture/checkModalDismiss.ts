import type { Page } from 'playwright'

import { modalDismissFailureOf } from '@/behaviour/modalDismissFailureOf.js'
import { readModal } from '@/capture/readModal.js'
import { reopenDialog } from '@/capture/reopenDialog.js'
import { stillOpenAfter } from '@/capture/stillOpenAfter.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * With a dialog open after the route's clicks: clicks its backdrop outside
 * the panel, reopens it by replaying the clicks, presses Escape, and reopens
 * it again so what follows sees the screen as measured. A dialog that cannot
 * be reopened is judged on what was tried.
 */
export const checkModalDismiss = async (
  page: Page,
  clicks: string[],
): Promise<BehaviourFailure[]> => {
  const modal = await readModal(page)
  if (!modal) return []
  const { point } = modal
  const backdrop = point
    ? await stillOpenAfter(page, async () =>
        page.mouse.click(point[0], point[1]),
      )
    : null
  const open = backdrop !== false || (await reopenDialog(page, clicks))
  const escape = open
    ? await stillOpenAfter(page, async () => page.keyboard.press('Escape'))
    : null
  if (escape === false) await reopenDialog(page, clicks)
  const failure = modalDismissFailureOf(modal.subject, backdrop, escape)
  return failure ? [failure] : []
}
