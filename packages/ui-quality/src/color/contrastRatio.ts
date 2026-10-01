import { relativeLuminance } from '@/color/relativeLuminance.js'
import type { Rgba } from '@/model/Rgba.js'

/** WCAG contrast ratio between two opaque colours, 1 to 21. */
export const contrastRatio = (first: Rgba, second: Rgba): number => {
  const [light, dark] = [
    relativeLuminance(first),
    relativeLuminance(second),
  ].sort((a, b) => b - a)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}
