import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { isPainted } from '@/rules/isPainted.js'

/** The colours an element actually shows: its text, its fill, its drawn borders. */
export const paintedColors = (
  element: ElementBox,
): { kind: 'text' | 'background' | 'border'; color: Rgba }[] => {
  const colors: { kind: 'text' | 'background' | 'border'; color: Rgba }[] = []
  if (element.text !== '' && isPainted(element.color))
    colors.push({ kind: 'text', color: element.color })
  if (isPainted(element.backgroundColor))
    colors.push({ kind: 'background', color: element.backgroundColor })
  element.borderWidths.forEach((width, side) => {
    const color = element.borderColors[side] ?? null
    if (width > 0 && isPainted(color)) colors.push({ kind: 'border', color })
  })
  return colors
}
