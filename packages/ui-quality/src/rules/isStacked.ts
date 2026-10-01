import type { ElementBox } from '@/model/ElementBox.js'

/** Each box starts at or below the bottom of the one before it, give or take a pixel. */
export const isStacked = (boxes: ElementBox[]): boolean =>
  boxes.every((box, index) => {
    const previous = boxes[index - 1]
    return !previous || box.y >= previous.y + previous.height - 1
  })
