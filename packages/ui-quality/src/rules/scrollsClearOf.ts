import type { ElementBox } from '@/model/ElementBox.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'
import { isPinnedToWindow } from '@/rules/isPinnedToWindow.js'

/**
 * Whether page content that a bar fixed to the bottom of the window covers at
 * the first frame scrolls out from under it: the page is tall enough to lift
 * the content's bottom above the bar's top. A phone tab bar over the rows
 * below the fold is how every such app looks before the first scroll. Content
 * under a bar fixed to the top cannot scroll clear and stays a finding.
 */
export const scrollsClearOf = (
  content: ElementBox,
  bar: ElementBox,
  snapshot: PageSnapshot,
): boolean => {
  const { elements } = snapshot
  if (!isPinnedToWindow(bar, elements)) return false
  if (isPinnedToWindow(content, elements)) return false
  if (bar.y + bar.height / 2 < snapshot.viewportHeight / 2) return false
  const lift = content.y + content.height - bar.y
  return lift <= snapshot.documentHeight - snapshot.viewportHeight
}
