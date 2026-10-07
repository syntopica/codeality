import type { ElementBox } from '@/model/ElementBox.js'
import { OPAQUE_ALPHA } from '@/rules/OPAQUE_ALPHA.js'
import { OPAQUE_MEDIA_TAGS } from '@/rules/OPAQUE_MEDIA_TAGS.js'

/** Hides what is behind it: an opaque fill, a background image, or a picture. */
export const paintsOpaque = (element: ElementBox): boolean =>
  (element.backgroundColor?.[3] ?? 0) >= OPAQUE_ALPHA ||
  element.hasBackgroundImage ||
  OPAQUE_MEDIA_TAGS.has(element.tag)
