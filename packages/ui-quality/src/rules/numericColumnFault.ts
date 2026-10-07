import type { ElementBox } from '@/model/ElementBox.js'
import { isLeftAligned } from '@/rules/isLeftAligned.js'
import { isNumericText } from '@/rules/isNumericText.js'
import { MIN_NUMERIC_TEXT_LENGTH } from '@/rules/MIN_NUMERIC_TEXT_LENGTH.js'
import { NUMERIC_SHARE } from '@/rules/NUMERIC_SHARE.js'

/**
 * What is wrong with a column of numbers, dates or times, or null when it is
 * not such a column or nothing is: values hung from the left edge, whose
 * digits do not line up by place, or digits of uneven width.
 */
export const numericColumnFault = (
  column: ElementBox[],
  minRows: number,
  tolerance: number,
): string | null => {
  const cells = column.filter(
    (box) => box.textLength >= MIN_NUMERIC_TEXT_LENGTH,
  )
  if (cells.length < minRows) return null
  const numeric = cells.filter((box) => isNumericText(box.text))
  if (numeric.length < cells.length * NUMERIC_SHARE) return null
  const faults: string[] = []
  if (isLeftAligned(numeric, tolerance))
    faults.push(
      'its values are left-aligned, so digits do not line up by place',
    )
  if (numeric.some((box) => !box.tabularDigits))
    faults.push('its digits are proportional (no tabular-nums)')
  return faults.length === 0 ? null : faults.join(' and ')
}
