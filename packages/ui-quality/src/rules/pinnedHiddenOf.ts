import type { ElementBox } from '@/model/ElementBox.js'

/**
 * How many px of a pinned box fall below the window once it is pinned: a
 * fixed box where it is drawn, a sticky one at its `top`. Its content counts
 * when it overflows the box, and so does the box itself when taller than the
 * window: a sticky side panel as tall as its content sticks with its bottom
 * off screen.
 */
export const pinnedHiddenOf = (
  element: ElementBox,
  viewportHeight: number,
): number => {
  const top = element.position === 'sticky' ? element.insetTop : element.y
  return top + Math.max(element.scrollHeight, element.height) - viewportHeight
}
