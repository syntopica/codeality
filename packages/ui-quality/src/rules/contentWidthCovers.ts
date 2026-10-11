import type { RuleOptions } from '@/config/RuleOptions.js'
import type { ElementBox } from '@/model/ElementBox.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'
import { hasDataLayout } from '@/rules/hasDataLayout.js'

/** `content-width` already reports this main region: a data page whose content spans too little of it. */
export const contentWidthCovers = (
  main: ElementBox,
  span: number,
  snapshot: PageSnapshot,
  options: RuleOptions['contentWidth'],
): boolean =>
  snapshot.viewportWidth >= options.minViewport &&
  span / main.width < options.minRatio &&
  hasDataLayout(main, snapshot.elements)
