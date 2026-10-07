import type { ElementBox } from '@/model/ElementBox.js'
import { isInMain } from '@/rules/isInMain.js'
import { isPillRadius } from '@/rules/isPillRadius.js'

/** The distinct corner radii, in px and ascending, of the main region's boxes; pills and circles left out. */
export const radiiOf = (elements: ElementBox[]): number[] =>
  [
    ...new Set(
      elements
        .filter(
          (element) =>
            element.borderRadius > 0 &&
            !isPillRadius(element) &&
            isInMain(element, elements),
        )
        .map((element) => Math.round(element.borderRadius)),
    ),
  ].toSorted((a, b) => a - b)
