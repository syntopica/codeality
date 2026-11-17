import { isModalLayer } from '@/rules/isModalLayer.js'
import { MIN_OCCLUDED_SHARE } from '@/rules/MIN_OCCLUDED_SHARE.js'
import { overlapArea } from '@/rules/overlapArea.js'
import { paintsOpaque } from '@/rules/paintsOpaque.js'
import type { Rule } from '@/rules/Rule.js'
import { scrollsClearOf } from '@/rules/scrollsClearOf.js'

// Text with something opaque painted over it: the element hit at the centre
// of its first line is not the text, its ancestor or its descendant, and
// covers over 20% of the text's box. An open dialog and its backdrop cover
// the page on purpose and are left alone, and so is text a bar fixed to the
// bottom covers only until the page scrolls.
export const textOcclusion: Rule = (snapshot) => {
  const { elements } = snapshot
  return elements.flatMap((element) => {
    const occluder =
      element.occluder === null ? undefined : elements[element.occluder]
    if (!occluder || !paintsOpaque(occluder)) return []
    if (isModalLayer(occluder, elements)) return []
    if (scrollsClearOf(element, occluder, snapshot)) return []
    const area = element.width * element.height
    if (
      area === 0 ||
      overlapArea(element, occluder) / area <= MIN_OCCLUDED_SHARE
    )
      return []
    return [
      {
        rule: 'text-occlusion',
        severity: 'error',
        message: `"${element.text.slice(0, 40)}" is painted over by ${occluder.selector}; move one of them or give the text room`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
}
