import { deltaE } from '@/color/deltaE.js'
import type { Lab } from '@/color/Lab.js'
import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { Rgba } from '@/model/Rgba.js'

export const nearestColor = (
  color: Rgba,
  palette: { rgba: Rgba; lab: Lab }[],
): { rgba: Rgba; distance: number } | null => {
  const lab = rgbaToLab(color)
  let best: { rgba: Rgba; distance: number } | null = null
  for (const entry of palette) {
    const distance = deltaE(lab, entry.lab)
    if (!best || distance < best.distance) best = { rgba: entry.rgba, distance }
  }
  return best
}
