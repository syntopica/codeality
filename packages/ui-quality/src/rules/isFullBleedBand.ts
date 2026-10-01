import type { ElementBox } from '@/model/ElementBox.js'
import type { InkEdges } from '@/rules/InkEdges.js'
import { MEDIA_TAGS } from '@/rules/MEDIA_TAGS.js'

/** A fill or rule with no content that spans the whole of `root`. */
export const isFullBleedBand = (
  element: ElementBox,
  span: InkEdges,
  root: ElementBox,
): boolean =>
  element.text === '' &&
  !element.isControl &&
  !MEDIA_TAGS.has(element.tag) &&
  span.left <= root.x + 1 &&
  span.right >= root.x + root.width - 1
