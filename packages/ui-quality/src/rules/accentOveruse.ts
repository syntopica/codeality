import { deltaE } from '@/color/deltaE.js'
import { rgbaToHex } from '@/color/rgbaToHex.js'
import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { ElementBox } from '@/model/ElementBox.js'
import { ACCENT_DELTA_E } from '@/rules/ACCENT_DELTA_E.js'
import { accentOf } from '@/rules/accentOf.js'
import { accentRegionOf } from '@/rules/accentRegionOf.js'
import { isFilledButton } from '@/rules/isFilledButton.js'
import type { Rule } from '@/rules/Rule.js'
import { toolbarIdsOf } from '@/rules/toolbarIdsOf.js'

// More than one button filled with the accent in one main region, form or
// dialog: when every action is primary, none is. The accent is
// `palette.accent`, or else the most saturated filled button. An action bar
// (two or more buttons side by side) is its own region, so a bulk-action bar
// may keep its one accent button beside the page's.
export const accentOveruse: Rule = (snapshot, context) => {
  const { elements } = snapshot
  const buttons = elements.filter(isFilledButton)
  const accent = accentOf(context.accent, buttons)
  if (!accent) return []
  const accentLab = rgbaToLab(accent)
  const toolbars = toolbarIdsOf(elements)
  const byRegion = new Map<ElementBox, ElementBox[]>()
  for (const button of buttons) {
    if (!button.backgroundColor) continue
    if (deltaE(rgbaToLab(button.backgroundColor), accentLab) > ACCENT_DELTA_E)
      continue
    const region = accentRegionOf(button, elements, toolbars)
    if (region) byRegion.set(region, [...(byRegion.get(region) ?? []), button])
  }
  return [...byRegion]
    .filter(([, accented]) => accented.length > 1)
    .map(([region, accented]) => ({
      rule: 'accent-overuse',
      severity: 'warn',
      message: `${String(accented.length)} buttons here are filled with the accent ${rgbaToHex(accent)} (${accented.map((button) => button.text || button.label || button.selector).join(', ')}); keep one primary action and draw the rest as secondary`,
      subject: region.selector,
      identity: region.signature,
    }))
}
