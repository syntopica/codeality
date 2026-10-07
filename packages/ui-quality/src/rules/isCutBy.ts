import type { ElementBox } from '@/model/ElementBox.js'
import { CLIP_TOLERANCE } from '@/rules/CLIP_TOLERANCE.js'
import { CLIPPING_OVERFLOWS } from '@/rules/CLIPPING_OVERFLOWS.js'

/** The box clips on an axis and `layer` reaches past its edge on that axis. */
export const isCutBy = (layer: ElementBox, clip: ElementBox): boolean => {
  const sideways =
    CLIPPING_OVERFLOWS.has(clip.overflowX) &&
    (layer.x < clip.x - CLIP_TOLERANCE ||
      layer.x + layer.width > clip.x + clip.width + CLIP_TOLERANCE)
  const vertically =
    CLIPPING_OVERFLOWS.has(clip.overflowY) &&
    (layer.y < clip.y - CLIP_TOLERANCE ||
      layer.y + layer.height > clip.y + clip.height + CLIP_TOLERANCE)
  return sideways || vertically
}
