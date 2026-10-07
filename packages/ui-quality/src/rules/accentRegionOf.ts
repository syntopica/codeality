import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/**
 * The view a button's emphasis competes in: its nearest dialog, form, action
 * bar or main region. Null outside every main region, form and dialog.
 */
export const accentRegionOf = (
  button: ElementBox,
  elements: ElementBox[],
  toolbars: Set<number>,
): ElementBox | null => {
  const chain = ancestorsOf(button, elements)
  const isView = (box: ElementBox): boolean =>
    box.isDialog || box.isMain || box.tag === 'form'
  if (!chain.some(isView)) return null
  return chain.find((box) => isView(box) || toolbars.has(box.id)) ?? null
}
