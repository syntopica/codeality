import type { ElementBox } from '@/model/ElementBox.js'
import { spreadOf } from '@/rules/spreadOf.js'

/**
 * What makes a line of controls ragged: single-line boxes of different
 * heights or centres, a multi-line field whose top is off the others', or
 * fields set in different font sizes. Empty when the line is even.
 */
export const controlRowFaults = (
  row: ElementBox[],
  tolerance: number,
): string[] => {
  const faults: string[] = []
  // A textarea may be taller than the line; only its top has to agree.
  const single = row.filter((control) => control.tag !== 'textarea')
  const heights = single.map((control) => control.height)
  if (single.length >= 2 && spreadOf(heights) > tolerance)
    faults.push(
      `heights ${String(Math.min(...heights))}-${String(Math.max(...heights))}px`,
    )
  const centres = single.map((control) => control.y + control.height / 2)
  if (single.length >= 2 && spreadOf(centres) > tolerance)
    faults.push(`centres ${String(Math.round(spreadOf(centres)))}px apart`)
  const tops = row.map((control) => control.y)
  if (single.length < row.length && spreadOf(tops) > tolerance)
    faults.push(`tops ${String(spreadOf(tops))}px apart`)
  const sizes = [
    ...new Set(
      row
        .filter((control) => control.isTextEntry || control.role === 'combobox')
        .map((control) => control.fontSize),
    ),
  ].toSorted((a, b) => a - b)
  if (sizes.length > 1)
    faults.push(`text ${sizes.map((size) => `${String(size)}px`).join(' vs ')}`)
  return faults
}
