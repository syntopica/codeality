import type { Rgba } from '@/model/Rgba.js'

export const isPainted = (color: Rgba | null): color is Rgba =>
  color !== null && color[3] > 0.05
