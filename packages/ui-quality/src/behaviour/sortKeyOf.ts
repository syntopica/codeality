import { DAY_MONTH_YEAR } from '@/behaviour/DAY_MONTH_YEAR.js'
import { EMPTY_CELL } from '@/behaviour/EMPTY_CELL.js'
import { numberOf } from '@/behaviour/numberOf.js'
import type { SortKey } from '@/behaviour/SortKey.js'

/** What a person reads a cell as when judging whether a column is sorted. */
export const sortKeyOf = (cell: string): SortKey => {
  const text = cell.replace(/\s+/g, ' ').trim()
  if (EMPTY_CELL.test(text)) return null
  const [, day = '', month = '', year = ''] = DAY_MONTH_YEAR.exec(text) ?? []
  if (year !== '')
    return Number(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`)
  if (/^\d{4}-\d{2}-\d{2}/.test(text))
    return Number(text.slice(0, 10).replaceAll('-', ''))
  return numberOf(text) ?? text
}
