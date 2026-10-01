import type { ColorScheme } from '@/model/ColorScheme.js'
import type { Viewport } from '@/model/Viewport.js'

/** One route rendered at one viewport in one colour scheme. */
export type Screen = {
  route: string
  viewport: Viewport
  colorScheme: ColorScheme
}
