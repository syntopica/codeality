import type { ElementBox } from '@/model/ElementBox.js'
import { labelBranchOf } from '@/rules/labelBranchOf.js'
import { labelCompositionBranchesOf } from '@/rules/labelCompositionBranchesOf.js'
import type { LabelIconText } from '@/rules/LabelIconText.js'

/** Resolve only an unambiguous sibling SVG/text composition local to a label. */
export const labelIconTextOf = (
  cell: ElementBox,
  children: Map<number, ElementBox[]>,
): LabelIconText | null => {
  const pair = labelCompositionBranchesOf(cell, children)
  if (!pair) return null
  const first = labelBranchOf(pair[0], children)
  const second = labelBranchOf(pair[1], children)
  if (!first || !second) return null
  const icon = first.tag === 'svg' ? first : second
  const text = first.tag === 'svg' ? second : first
  return icon.tag === 'svg' && text.tag !== 'svg' ? { icon, text } : null
}
