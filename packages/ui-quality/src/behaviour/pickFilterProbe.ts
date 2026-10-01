import type { FilterProbe } from '@/behaviour/FilterProbe.js'
import { foldText } from '@/behaviour/foldText.js'

/**
 * A word from a visible row that at most half the rows contain, so that a
 * working search keeps that row and visibly drops others. Null when no row
 * offers one.
 */
export const pickFilterProbe = (rows: string[]): FilterProbe | null => {
  const folded = rows.map(foldText)
  for (const [rowIndex, row] of rows.entries()) {
    for (const word of row.split(/[\s|·,;:()]+/)) {
      const token = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      if (token.length < 4 || !/\p{L}/u.test(token)) continue
      const needle = foldText(token)
      const matching = folded.filter((text) => text.includes(needle)).length
      if (matching * 2 <= rows.length) return { token, rowIndex }
    }
  }
  return null
}
