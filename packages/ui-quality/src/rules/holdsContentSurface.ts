import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { descendantsOf } from '@/rules/descendantsOf.js'
import { isCardLike } from '@/rules/isCardLike.js'

/**
 * The region holds a card-like surface with no field in it: a panel of
 * results or figures, not the form of a sign-in page.
 */
export const holdsContentSurface = (
  region: ElementBox,
  elements: ElementBox[],
  canvas: Rgba,
): boolean =>
  descendantsOf(region, elements).some(
    (box) =>
      isCardLike(box, elements, canvas) &&
      !descendantsOf(box, elements).some((inner) => inner.isTextEntry),
  )
