import type { ElementBox } from '@/model/ElementBox.js'
import { ACTION_TAGS } from '@/rules/ACTION_TAGS.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/** The link or button an icon stands for, when no visible text explains it. */
export const iconOnlyControlOf = (
  icon: ElementBox,
  elements: ElementBox[],
): ElementBox | null => {
  const control = ancestorsOf(icon, elements)
    .slice(0, 3)
    .find((ancestor) => ACTION_TAGS.has(ancestor.tag))
  if (!control || control.text !== '') return null
  const labelled = descendantsOf(control, elements).some(
    (element) => element.text !== '',
  )
  return labelled ? null : control
}
