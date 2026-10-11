import type { ElementBox } from '@/model/ElementBox.js'
import { isInFlow } from '@/rules/isInFlow.js'

/** A block-level box in the normal flow: one a column stacks, not a run of inline text or a layer. */
export const isBlockInFlow = (element: ElementBox): boolean =>
  isInFlow(element) && !element.display.startsWith('inline')
