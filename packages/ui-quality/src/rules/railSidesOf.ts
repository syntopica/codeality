import type { ElementBox } from '@/model/ElementBox.js'
import type { PageSnapshot } from '@/model/PageSnapshot.js'

/**
 * The sides of `main` a rail fixed to the window stands on: a sidebar at
 * least half the window tall that ends where the main region starts. The
 * header runs over the rail there, so its edge has nothing to line up with.
 */
export const railSidesOf = (
  main: ElementBox,
  snapshot: PageSnapshot,
): Set<string> => {
  const sides = new Set<string>()
  for (const element of snapshot.elements) {
    if (element.position !== 'fixed') continue
    if (element.height < snapshot.viewportHeight / 2) continue
    if (element.x + element.width <= main.x + 1) sides.add('left')
    if (element.x >= main.x + main.width - 1) sides.add('right')
  }
  return sides
}
