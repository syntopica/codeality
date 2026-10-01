import type { ElementBox } from '@/model/ElementBox.js'
import { CUT_PILE_WINDOW } from '@/rules/CUT_PILE_WINDOW.js'

/**
 * Whether more texts sit at `longest` than just below it. Natural lengths
 * thin out smoothly towards the longest: three whole account names of exactly
 * 50 characters sat over twelve of 40 to 49.
 */
export const pilesAtLongest = (
  texts: ElementBox[],
  longest: number,
): boolean => {
  const atLongest = texts.filter((cell) => cell.textLength === longest).length
  const justShorter = texts.filter(
    (cell) =>
      cell.textLength < longest && cell.textLength >= longest - CUT_PILE_WINDOW,
  ).length
  return atLongest > justShorter
}
