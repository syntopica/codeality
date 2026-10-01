import { srgbToLinear } from '@/color/srgbToLinear.js'
import type { Rgba } from '@/model/Rgba.js'

/** WCAG relative luminance of an opaque colour. */
export const relativeLuminance = ([r, g, b]: Rgba): number =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
