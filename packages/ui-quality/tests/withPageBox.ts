import type { ElementBox } from '@/model/ElementBox.js'
import { elementBox } from '@tests/elementBox.js'

/** The boxes plus one more element outside the table, appended last so ids stay indexes. */
export const withPageBox = (
  boxes: ElementBox[],
  overrides: Partial<ElementBox>,
): ElementBox[] => [...boxes, elementBox({ id: boxes.length, ...overrides })]
