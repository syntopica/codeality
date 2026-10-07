import { deltaE } from '@/color/deltaE.js'
import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { Rgba } from '@/model/Rgba.js'
import type { ColorMatch } from '@/rules/ColorMatch.js'
import type { PaletteColor } from '@/rules/PaletteColor.js'

export const nearestColor = (
  color: Rgba,
  palette: PaletteColor[],
): ColorMatch | null => {
  const lab = rgbaToLab(color)
  let best: ColorMatch | null = null
  for (const entry of palette) {
    const distance = deltaE(lab, entry.lab)
    if (!best || distance < best.distance) best = { rgba: entry.rgba, distance }
  }
  return best
}
