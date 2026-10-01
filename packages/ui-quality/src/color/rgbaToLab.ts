import type { Lab } from '@/color/Lab.js'
import { labPivot } from '@/color/labPivot.js'
import { srgbToLinear } from '@/color/srgbToLinear.js'
import type { Rgba } from '@/model/Rgba.js'

/** sRGB to CIE L*a*b*, D65 white point. Alpha is ignored. */
export const rgbaToLab = ([r, g, b]: Rgba): Lab => {
  const [lr, lg, lb] = [r, g, b].map(srgbToLinear) as [number, number, number]
  const x = (lr * 0.412_456_4 + lg * 0.357_576_1 + lb * 0.180_437_5) / 0.950_47
  const y = lr * 0.212_672_9 + lg * 0.715_152_2 + lb * 0.072_175
  const z = (lr * 0.019_333_9 + lg * 0.119_192 + lb * 0.950_304_1) / 1.088_83
  const [fx, fy, fz] = [x, y, z].map(labPivot) as [number, number, number]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
