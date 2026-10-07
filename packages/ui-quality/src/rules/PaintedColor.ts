import type { Rgba } from '@/model/Rgba.js'

export type PaintedColor = {
  kind: 'text' | 'background' | 'border'
  color: Rgba
}
