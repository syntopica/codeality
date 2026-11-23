import type { ElementBox } from '@/model/ElementBox.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { clipsOverflow } from '@/rules/clipsOverflow.js'
import { columnSlackOf } from '@/rules/columnSlackOf.js'
import { TRUNCATION_SLACK_MARGIN } from '@/rules/TRUNCATION_SLACK_MARGIN.js'

/**
 * Text cut to an ellipsis while a wider neighbour on its row keeps more unused
 * width than the text is missing, in every row of the list: "Comisiones
 * banc..." in a fixed 112px beside a stretched cell that holds two words. The
 * ellipsis tells the reader something is hidden; here nothing had to be. A
 * narrower neighbour is a fixed column, such as a sender beside a preview.
 */
export const truncatedBesideSlackFinding = (
  element: ElementBox,
  elements: ElementBox[],
): RawFinding | null => {
  const missing = element.scrollWidth - element.clientWidth
  if (
    element.text === '' ||
    missing <= 1 ||
    element.textOverflow !== 'ellipsis' ||
    !clipsOverflow(element)
  )
    return null
  const slack = Math.max(
    0,
    ...elements
      .filter(
        (other) =>
          other.id !== element.id &&
          other.parent === element.parent &&
          other.width > element.width &&
          other.y < element.y + element.height &&
          element.y < other.y + other.height,
      )
      .map((other) => columnSlackOf(other, elements)),
  )
  if (slack < missing + TRUNCATION_SLACK_MARGIN) return null
  return {
    rule: 'text-clipped',
    severity: 'error',
    message: `text is truncated ${String(Math.round(missing))}px short while a wider neighbour on its row leaves ${String(Math.round(slack))}px unused: "${element.text}"; let the text take that room`,
    subject: element.selector,
    identity: element.selector,
  }
}
