import type { ElementBox } from '@/model/ElementBox.js'
import { AMOUNT_VALUE_TEXT } from '@/rules/AMOUNT_VALUE_TEXT.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/** The last amount shown in `root`, spaces and minus signs normalised; null without one. */
export const amountTextOf = (
  root: ElementBox,
  elements: ElementBox[],
): string | null => {
  const amount = [root, ...descendantsOf(root, elements)].findLast((box) =>
    AMOUNT_VALUE_TEXT.test(box.text),
  )
  return amount ? amount.text.replace(/\s/g, '').replace('−', '-') : null
}
