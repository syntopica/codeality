import type { ElementBox } from '@/model/ElementBox.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { LABEL_MAX_WORDS } from '@/rules/LABEL_MAX_WORDS.js'
import { labelIconIsMisaligned } from '@/rules/labelIconIsMisaligned.js'
import { labelIconTextOf } from '@/rules/labelIconTextOf.js'
import { textBoxOf } from '@/rules/textBoxOf.js'
import { textSpanOf } from '@/rules/textSpanOf.js'

/** One width or icon finding for an eligible short wrapped label. */
export const labelWrapFindingOf = (
  cell: ElementBox,
  value: ElementBox,
  elements: ElementBox[],
  children: Map<number, ElementBox[]>,
): RawFinding | null => {
  const composition = labelIconTextOf(cell, children)
  const label = textBoxOf(cell, children) ?? composition?.text
  if (!label || label.lines < 2) return null
  if (label.text.split(/\s+/).length > LABEL_MAX_WORDS) return null
  const needed = (label.lines - 1) * (label.textRight - label.textLeft)
  const free = value.width - textSpanOf(value, elements)
  const misaligned = composition && labelIconIsMisaligned(composition)
  if (!misaligned && free < needed + 8) return null
  return {
    rule: 'label-wrap',
    severity: 'error',
    message: misaligned
      ? `the SVG viewport beside the wrapped label "${label.text}" is not centred on its first text line; align the icon with that line instead of the whole label block`
      : `the label "${label.text}" wraps onto ${String(label.lines)} lines while its value leaves ${String(Math.round(free))}px free; size the label column to its content (grid-template-columns: max-content 1fr)`,
    subject: label.selector,
    identity: cell.signature,
  }
}
