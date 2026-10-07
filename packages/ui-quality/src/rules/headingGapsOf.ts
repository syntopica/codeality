import type { ElementBox } from '@/model/ElementBox.js'
import type { HeadingGaps } from '@/rules/HeadingGaps.js'
import { isInFlow } from '@/rules/isInFlow.js'

/** The space above and below a heading among its siblings, in px; null when it sits first, last or beside another block. */
export const headingGapsOf = (
  heading: ElementBox,
  siblings: ElementBox[],
): HeadingGaps | null => {
  const flow = siblings.filter(isInFlow)
  const index = flow.findIndex((sibling) => sibling.id === heading.id)
  const previous = flow[index - 1]
  const next = flow[index + 1]
  if (!previous || !next) return null
  const above = heading.y - (previous.y + previous.height)
  const below = next.y - (heading.y + heading.height)
  return above < 0 || below < 0 ? null : { above, below }
}
