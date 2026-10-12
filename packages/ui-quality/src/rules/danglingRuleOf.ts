import type { ElementBox } from '@/model/ElementBox.js'
import { drawsBottomRule } from '@/rules/drawsBottomRule.js'
import { endsItsFrame } from '@/rules/endsItsFrame.js'
import { lastListItemOf } from '@/rules/lastListItemOf.js'

/**
 * The element drawing a rule under the last item of a divided list when
 * nothing follows it in its card: the last item's own bottom border, or the
 * list's. Null when a footer, a total or anything else comes after.
 */
export const danglingRuleOf = (
  list: ElementBox,
  rows: ElementBox[],
  elements: ElementBox[],
  children: Map<number, ElementBox[]>,
): ElementBox | null => {
  const last = lastListItemOf(list, rows, children)
  if (!last) return null
  if (rows.every(drawsBottomRule))
    return endsItsFrame(last, elements, children) ? last : null
  const divided = rows.some(
    (row) => drawsBottomRule(row) || row.borderWidths[0] > 0,
  )
  return divided &&
    drawsBottomRule(list) &&
    endsItsFrame(list, elements, children)
    ? list
    : null
}
