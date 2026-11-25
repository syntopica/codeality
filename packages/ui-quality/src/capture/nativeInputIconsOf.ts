import type { Page } from 'playwright'

import type { CdpDocument } from '@/capture/CdpDocument.js'
import { indicatorBoxOf } from '@/capture/indicatorBoxOf.js'
import { MARK_DATE_INPUTS_SCRIPT } from '@/capture/MARK_DATE_INPUTS_SCRIPT.js'
import { markedIndicatorsOf } from '@/capture/markedIndicatorsOf.js'
import type { ScrollOffset } from '@/capture/ScrollOffset.js'
import { UNMARK_DATE_INPUTS_SCRIPT } from '@/capture/UNMARK_DATE_INPUTS_SCRIPT.js'
import type { InputIcon } from '@/model/InputIcon.js'

/**
 * The picker icons Chromium draws inside date, time, datetime-local, month and
 * week inputs. Run after the probe, which leaves its element ids on the page.
 */
export const nativeInputIconsOf = async (page: Page): Promise<InputIcon[]> => {
  const scroll: ScrollOffset = await page.evaluate(MARK_DATE_INPUTS_SCRIPT)
  const session = await page.context().newCDPSession(page)
  try {
    await session.send('DOM.enable')
    await session.send('CSS.enable')
    const { root } = (await session.send('DOM.getDocument', {
      depth: -1,
      pierce: true,
    })) as CdpDocument
    const icons = await Promise.all(
      markedIndicatorsOf(root).map(async (marked) =>
        indicatorBoxOf(session, marked, scroll).catch(() => null),
      ),
    )
    return icons.filter((icon) => icon !== null)
  } finally {
    await session.detach().catch(() => undefined)
    await page.evaluate(UNMARK_DATE_INPUTS_SCRIPT)
  }
}
