import { blendOver } from '@/color/blendOver.js'
import { rgbaToLab } from '@/color/rgbaToLab.js'
import { backdropOf } from '@/rules/backdropOf.js'
import { DARK_SURFACE_LIGHTNESS } from '@/rules/DARK_SURFACE_LIGHTNESS.js'
import { isColoredBlur } from '@/rules/isColoredBlur.js'
import { isGlow } from '@/rules/isGlow.js'
import { isPainted } from '@/rules/isPainted.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import type { Rule } from '@/rules/Rule.js'

// A coloured halo around a box or a word (offset 0 0, blur 8px and up) is how
// a dark "futuristic" page announces itself, and on a dark surface any
// coloured blur glows. A grey drop shadow, or a ring with no blur, is not
// one. Advisory.
export const glowShadow: Rule = (snapshot) => {
  const { elements } = snapshot
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  return elements.flatMap((element) => {
    const layers = [...element.boxShadows, ...element.textShadows]
    if (layers.length === 0) return []
    const behind = backdropOf(element, elements, canvas)
    const surface = isPainted(element.backgroundColor)
      ? blendOver(element.backgroundColor, behind)
      : behind
    const dark = rgbaToLab(surface)[0] < DARK_SURFACE_LIGHTNESS
    if (
      !layers.some((layer) => isGlow(layer) || (dark && isColoredBlur(layer)))
    )
      return []
    return [
      {
        rule: 'glow-shadow',
        severity: 'warn',
        message:
          'a coloured glow (a blurred shadow with no offset, or any coloured blur on a dark surface); use a neutral shadow or none',
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
}
