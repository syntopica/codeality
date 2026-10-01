import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

export const descendantsOf = (
  root: ElementBox,
  elements: ElementBox[],
): ElementBox[] =>
  elements.filter((element) =>
    ancestorsOf(element, elements).some((ancestor) => ancestor.id === root.id),
  )
