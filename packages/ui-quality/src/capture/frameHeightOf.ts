import type { Page } from 'playwright'

import { TOGGLE_FRAME_HEIGHT } from '@/capture/TOGGLE_FRAME_HEIGHT.js'

/** The height of the bar around the main region's `index`-th toggle group; 0 when it cannot be read. */
export const frameHeightOf = async (
  page: Page,
  main: string,
  index: number,
): Promise<number> =>
  await page
    .evaluate(
      `(${TOGGLE_FRAME_HEIGHT})(${JSON.stringify(main)}, ${String(index)})`,
    )
    .then(Number)
    .catch(() => 0)
