import type { Dialog, Page } from 'playwright'

import { actionFailureOf } from '@/behaviour/actionFailureOf.js'
import { CLICK_TIMEOUT_MS } from '@/capture/CLICK_TIMEOUT_MS.js'
import { failWrites } from '@/capture/failWrites.js'
import { feedbackCount } from '@/capture/feedbackCount.js'
import { sawFeedback } from '@/capture/sawFeedback.js'
import { submitControlOf } from '@/capture/submitControlOf.js'
import { visibleTextLines } from '@/capture/visibleTextLines.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Submits the first form of the main region with every write failing, and
 * checks the user is told. A form the browser itself refuses (a required
 * field left empty) is told by the browser, so it passes.
 */
export const checkAction = async (
  page: Page,
  main: string,
): Promise<BehaviourFailure[]> => {
  const submit = await submitControlOf(page, main)
  if (!submit) return []
  const subject = `form submit "${(await submit.innerText().catch(() => '')).trim() || 'submit'}"`
  const invalidForm = submit
    .locator('xpath=ancestor::form[1]')
    .and(page.locator('form:invalid'))
  if ((await invalidForm.count()) > 0) return []
  const before = {
    lines: await visibleTextLines(page),
    feedback: await feedbackCount(page),
    url: page.url(),
  }
  let dialogShown = false
  const onDialog = (dialog: Dialog): void => {
    dialogShown = true
    void dialog.dismiss()
  }
  page.on('dialog', onDialog)
  const writes = await failWrites(page)
  try {
    await submit.click({ timeout: CLICK_TIMEOUT_MS })
    const informed = (await sawFeedback(page, before)) || dialogShown
    const failure = actionFailureOf(subject, informed, writes.attempted())
    return failure ? [failure] : []
  } finally {
    await writes.stop()
    page.off('dialog', onDialog)
  }
}
