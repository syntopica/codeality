import type { ElementBox } from '@/model/ElementBox.js'
import { isActionLike } from '@/rules/isActionLike.js'
import { OPAQUE_ALPHA } from '@/rules/OPAQUE_ALPHA.js'

/**
 * An enabled button, or a link drawn as one (rounded), with an opaque fill:
 * the actions a screen raises above the rest.
 */
export const isFilledButton = (element: ElementBox): boolean =>
  isActionLike(element) &&
  (element.tag !== 'a' || element.borderRadius > 0) &&
  !element.disabled &&
  (element.backgroundColor?.[3] ?? 0) >= OPAQUE_ALPHA
