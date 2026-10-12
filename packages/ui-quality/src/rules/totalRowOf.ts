import type { ElementBox } from '@/model/ElementBox.js'
import { amountTextOf } from '@/rules/amountTextOf.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/** The nearest ancestor, within three levels, that shows an amount beside the label. */
export const totalRowOf = (
  label: ElementBox,
  elements: ElementBox[],
): ElementBox | null =>
  ancestorsOf(label, elements)
    .slice(0, 3)
    .find((box) => amountTextOf(box, elements) !== null) ?? null
