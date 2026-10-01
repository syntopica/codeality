import type { ElementBox } from '@/model/ElementBox.js'
import { isPainted } from '@/rules/isPainted.js'

/**
 * Top, right, bottom and left: whether the container draws that edge. A
 * filled box draws all four; an unfilled one only those with a border, so a
 * list row with a top rule has no left edge for a field to touch.
 */
export const drawnSides = (
  container: ElementBox,
): [boolean, boolean, boolean, boolean] => {
  const filled = isPainted(container.backgroundColor)
  const side = (index: number) =>
    filled ||
    ((container.borderWidths[index] ?? 0) > 0 &&
      isPainted(container.borderColors[index] ?? null))
  return [side(0), side(1), side(2), side(3)]
}
