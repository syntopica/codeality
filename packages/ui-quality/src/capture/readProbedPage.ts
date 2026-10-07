import { freeAnimationsOf } from '@/capture/freeAnimationsOf.js'
import type { ProbedPageReading } from '@/capture/ProbedPageReading.js'
import type { ScreenPage } from '@/capture/ScreenPage.js'
import { tabThroughPage } from '@/capture/tabThroughPage.js'

/**
 * The passes that use a probed page rather than measure it: the Tab pass,
 * then the animations that run with motion not reduced. A pass that fails
 * reads as nothing.
 */
export const readProbedPage = async (
  page: ScreenPage['page'],
  probe: string,
  mainSelector: string,
): Promise<ProbedPageReading> => ({
  focusStops: await tabThroughPage(page).catch(() => []),
  freeAnimations: await freeAnimationsOf(page, probe, mainSelector).catch(
    () => [],
  ),
})
