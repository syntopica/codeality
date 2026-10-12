import type { ElementBox } from '@/model/ElementBox.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'

/**
 * Whether a pinned box starts inside the window: an off-canvas drawer moved
 * out of view does not. A sticky box is judged across only, since it sticks
 * wherever down the page it starts.
 */
export const isOnScreen = (
  element: ElementBox,
  snapshot: PageSnapshot,
): boolean =>
  (element.position === 'sticky' || element.y < snapshot.viewportHeight) &&
  element.x < snapshot.viewportWidth &&
  element.x + element.width > 0
