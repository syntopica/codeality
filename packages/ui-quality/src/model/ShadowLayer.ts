import type { Rgba } from '@/model/Rgba.js'

/** One layer of a box or text shadow, lengths in px. */
export type ShadowLayer = {
  x: number
  y: number
  blur: number
  /** Always 0 for a text shadow, which has none. */
  spread: number
  inset: boolean
  color: Rgba
}
