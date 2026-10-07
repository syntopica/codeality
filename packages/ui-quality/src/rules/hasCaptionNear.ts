import type { ElementBox } from '@/model/ElementBox.js'
import { LABEL_REACH } from '@/rules/LABEL_REACH.js'
import { overlapsHorizontally } from '@/rules/overlapsHorizontally.js'

/** Some other text sits within 48px above the field, or to its left on the same line. */
export const hasCaptionNear = (
  field: ElementBox,
  elements: ElementBox[],
): boolean =>
  elements.some((other) => {
    if (other.id === field.id || other.text === '') return false
    const above =
      overlapsHorizontally(other, field) &&
      field.y - (other.y + other.height) <= LABEL_REACH &&
      other.y + other.height <= field.y + 2
    const left =
      other.y < field.y + field.height &&
      field.y < other.y + other.height &&
      field.x - (other.x + other.width) <= LABEL_REACH &&
      other.x + other.width <= field.x + 2
    return above || left
  })
