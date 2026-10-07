import type { ElementBox } from '@/model/ElementBox.js'
import { NEAR_SIZE_PX } from '@/rules/NEAR_SIZE_PX.js'
import type { NearSizes } from '@/rules/NearSizes.js'
import { roundedFontSize } from '@/rules/roundedFontSize.js'

/** Each parent whose texts use two sizes 1px or less apart, with the first such pair. */
export const nearSizesOf = (texts: ElementBox[]): NearSizes[] => {
  const byParent = new Map<number, Set<number>>()
  for (const text of texts) {
    if (text.parent === null) continue
    const sizes = byParent.get(text.parent) ?? new Set<number>()
    sizes.add(roundedFontSize(text))
    byParent.set(text.parent, sizes)
  }
  return [...byParent].flatMap(([parent, set]) => {
    const sizes = [...set].toSorted((a, b) => a - b)
    const index = sizes.findIndex(
      (size, i) => i > 0 && size - (sizes[i - 1] ?? 0) <= NEAR_SIZE_PX,
    )
    const [low, high] = [sizes[index - 1], sizes[index]]
    if (low === undefined || high === undefined) return []
    return [{ parent, sizes: [low, high] }]
  })
}
