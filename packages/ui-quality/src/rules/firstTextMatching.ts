import type { ElementBox } from '@/model/ElementBox.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/** The first element, `root` or below it in document order, whose own text matches. */
export const firstTextMatching = (
  root: ElementBox,
  elements: ElementBox[],
  pattern: RegExp,
): ElementBox | null =>
  [root, ...descendantsOf(root, elements)].find((box) =>
    pattern.test(box.text),
  ) ?? null
