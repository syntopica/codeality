import { rgbaToOklch } from '@/color/rgbaToOklch.js'
import type { ShadowLayer } from '@/model/ShadowLayer.js'
import { GLOW_MIN_BLUR } from '@/rules/GLOW_MIN_BLUR.js'
import { GLOW_MIN_CHROMA } from '@/rules/GLOW_MIN_CHROMA.js'

/** An outer shadow centred on its box (no offset), blurred wide and coloured: a halo. */
export const isGlow = (layer: ShadowLayer): boolean =>
  !layer.inset &&
  layer.x === 0 &&
  layer.y === 0 &&
  layer.blur >= GLOW_MIN_BLUR &&
  rgbaToOklch(layer.color).c > GLOW_MIN_CHROMA
