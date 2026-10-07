import type { ElementBox } from '@/model/ElementBox.js'
import { CLOSE_CONTROL_NAME } from '@/rules/CLOSE_CONTROL_NAME.js'

/** Whether an action only closes what holds it, by its text or its `aria-label`. */
export const isCloseControl = (element: ElementBox): boolean =>
  CLOSE_CONTROL_NAME.test(element.text) ||
  CLOSE_CONTROL_NAME.test(element.label)
