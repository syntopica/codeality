import { contentWidthCovers } from '@/rules/contentWidthCovers.js'
import { inkEdgesOf } from '@/rules/inkEdgesOf.js'
import { isLaidOutPage } from '@/rules/isLaidOutPage.js'
import { NARROW_PAGE_MIN_VIEWPORT } from '@/rules/NARROW_PAGE_MIN_VIEWPORT.js'
import { NARROW_PAGE_RATIO } from '@/rules/NARROW_PAGE_RATIO.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import { regionEdgesOf } from '@/rules/regionEdgesOf.js'
import type { Rule } from '@/rules/Rule.js'

// A whole page capped to a reading column on a wide screen: a report at
// `max-w-4xl`, centred on 1920px, with two empty bands either side. Nothing
// in it fills its column, so `ragged-column` is silent, and with no table
// `content-width` is too. The page is judged against the screen less any
// side panel. Running text keeps its measure on purpose, so a page with no
// card-like surface and no data layout is left alone, and so is a lone form;
// a data page whose column `content-width` already reports is not reported
// twice.
export const narrowPage: Rule = (snapshot, context) => {
  if (snapshot.viewportWidth < NARROW_PAGE_MIN_VIEWPORT) return []
  const { elements } = snapshot
  const main = elements.find((element) => element.isMain)
  if (!main || main.width === 0) return []
  const ink = inkEdgesOf(main, elements)
  if (!ink) return []
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  if (!isLaidOutPage(main, elements, canvas)) return []
  const span = ink.right - ink.left
  const covered = contentWidthCovers(
    main,
    span,
    snapshot,
    context.options.contentWidth,
  )
  if (covered) return []
  const region = regionEdgesOf(main, elements, snapshot.viewportWidth)
  const width = region.right - region.left
  const ratio = span / width
  if (ratio >= NARROW_PAGE_RATIO) return []
  return [
    {
      rule: 'narrow-page',
      severity: 'error',
      message: `the page spans ${String(Math.round(span))}px of the ${String(Math.round(width))}px left to it (${String(Math.round(ratio * 100))}%, minimum ${String(Math.round(NARROW_PAGE_RATIO * 100))}%) at ${String(snapshot.viewportWidth)}px; widen its container or lay its sections side by side`,
      subject: main.selector,
      identity: 'main',
    },
  ]
}
