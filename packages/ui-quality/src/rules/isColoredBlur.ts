import { rgbaToOklch } from '@/color/rgbaToOklch.js'
import type { ShadowLayer } from '@/model/ShadowLayer.js'
import { GLOW_MIN_CHROMA } from '@/rules/GLOW_MIN_CHROMA.js'

/** An outer shadow with any blur and a colour that is not grey. */
export const isColoredBlur = (layer: ShadowLayer): boolean =>
  !layer.inset && layer.blur > 0 && rgbaToOklch(layer.color).c > GLOW_MIN_CHROMA
