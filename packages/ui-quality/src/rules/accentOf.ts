import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { chromaOf } from '@/rules/chromaOf.js'
import { MIN_ACCENT_CHROMA } from '@/rules/MIN_ACCENT_CHROMA.js'

/**
 * The configured accent, or else the most saturated fill among the filled
 * buttons, when it is a colour at all; null on a screen of grey buttons.
 */
export const accentOf = (
  configured: Rgba | null,
  buttons: ElementBox[],
): Rgba | null => {
  if (configured) return configured
  const chroma = (fill: Rgba): number => chromaOf(rgbaToLab(fill))
  return buttons.reduce<Rgba | null>((best, { backgroundColor: fill }) => {
    if (!fill || chroma(fill) < MIN_ACCENT_CHROMA) return best
    return !best || chroma(fill) > chroma(best) ? fill : best
  }, null)
}
