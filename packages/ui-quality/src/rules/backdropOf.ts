import { blendOver } from '@/color/blendOver.js'
import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { isPainted } from '@/rules/isPainted.js'
import { WHITE } from '@/rules/WHITE.js'

/**
 * The colour behind an element as the screen shows it: every fill from the
 * nearest opaque one inwards, composited, over a white canvas. A bg-primary/10
 * button read as its bare primary made a primary icon on it look 1:1.
 */
export const backdropOf = (
  element: ElementBox,
  elements: ElementBox[],
): Rgba => {
  const fills: Rgba[] = []
  for (const ancestor of ancestorsOf(element, elements)) {
    const fill = ancestor.backgroundColor
    if (!fill || !isPainted(fill)) continue
    fills.push(fill)
    if (fill[3] >= 1) break
  }
  return fills.reduceRight<Rgba>((below, fill) => blendOver(fill, below), WHITE)
}
