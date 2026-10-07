import type { ElementBox } from '@/model/ElementBox.js'
import { CHIP_HEIGHT } from '@/rules/CHIP_HEIGHT.js'
import { MIN_CHIP_TEXT_INSET } from '@/rules/MIN_CHIP_TEXT_INSET.js'
import { MIN_TEXT_INSET } from '@/rules/MIN_TEXT_INSET.js'

/** The least space between a box's edge and its text: a chip is allowed a tighter one. */
export const textInsetFloor = (box: ElementBox): number =>
  box.height < CHIP_HEIGHT ? MIN_CHIP_TEXT_INSET : MIN_TEXT_INSET
