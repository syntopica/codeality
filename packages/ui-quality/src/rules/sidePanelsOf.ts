import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { sharesRow } from '@/rules/sharesRow.js'

/**
 * What sits beside the main region rather than above or below it: the
 * siblings of the main element and of each of its ancestors that share its
 * row and do not overlap it sideways, such as a navigation sidebar.
 */
export const sidePanelsOf = (
  main: ElementBox,
  elements: ElementBox[],
): ElementBox[] => {
  const chain = [main, ...ancestorsOf(main, elements)]
  return elements.filter(
    (box) =>
      box.width > 0 &&
      chain.some(
        (link) =>
          box.parent === link.parent &&
          box.id !== link.id &&
          sharesRow(box, main) &&
          (box.x + box.width <= main.x || box.x >= main.x + main.width),
      ),
  )
}
