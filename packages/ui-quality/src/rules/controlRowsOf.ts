import type { ElementBox } from '@/model/ElementBox.js'
import { containingFrameOf } from '@/rules/containingFrameOf.js'
import { isBoxedControl } from '@/rules/isBoxedControl.js'
import { sitsBeside } from '@/rules/sitsBeside.js'

/**
 * Boxed controls on one line of one card, left to right, two or more per
 * line. Controls in different cards or panels, on different lines of a
 * wrapping bar, or further apart than `maxGap` are on different lines.
 */
export const controlRowsOf = (
  elements: ElementBox[],
  maxGap: number,
): ElementBox[][] => {
  const controls = elements
    .filter((element) => isBoxedControl(element))
    .toSorted((a, b) => a.x - b.x)
  const frames = new Map(
    controls.map((control) => [
      control.id,
      containingFrameOf(control, elements),
    ]),
  )
  const rows: ElementBox[][] = []
  // shortcut: a control joins the first line it touches and never merges two
  // lines; left-to-right order makes a bridge between two lines rare.
  for (const control of controls) {
    const row = rows.find((members) =>
      members.some(
        (member) =>
          frames.get(member.id) === frames.get(control.id) &&
          sitsBeside(member, control, maxGap),
      ),
    )
    if (row) row.push(control)
    else rows.push([control])
  }
  return rows.filter((row) => row.length >= 2)
}
