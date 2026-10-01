import type { ElementBox } from '@/model/ElementBox.js'

/** Runs of siblings sharing a signature, at least `minRows` long: list rows. */
export const rowGroups = (
  siblings: ElementBox[],
  minRows: number,
): ElementBox[][] => {
  const bySignature = new Map<string, ElementBox[]>()
  for (const sibling of siblings) {
    const group = bySignature.get(sibling.signature) ?? []
    group.push(sibling)
    bySignature.set(sibling.signature, group)
  }
  return [...bySignature.values()].filter((group) => group.length >= minRows)
}
