import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'

/**
 * The ancestors that can clip an absolutely positioned box: those from its
 * parent up to and including its containing block, the nearest positioned
 * one. An ancestor above that never reaches it; with no positioned ancestor
 * the box is placed against the page and nothing clips it.
 */
export const clippingAncestorsOf = (
  box: ElementBox,
  elements: ElementBox[],
): ElementBox[] => {
  const chain = ancestorsOf(box, elements)
  const block = chain.findIndex((ancestor) => ancestor.position !== 'static')
  return block === -1 ? [] : chain.slice(0, block + 1)
}
