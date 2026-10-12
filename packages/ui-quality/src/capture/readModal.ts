import type { Page } from 'playwright'

import { MODAL_READ } from '@/capture/MODAL_READ.js'
import type { ModalReading } from '@/capture/ModalReading.js'
import { OPEN_DIALOG } from '@/capture/OPEN_DIALOG.js'

/** The open dialog of the page and its backdrop point; null when none is open or it cannot be read. */
export const readModal = async (page: Page): Promise<ModalReading | null> =>
  (await page
    .evaluate(`(${MODAL_READ})(${JSON.stringify(OPEN_DIALOG)})`)
    .catch(() => null)) as ModalReading | null
