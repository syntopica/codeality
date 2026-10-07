import { headerCellsOf } from '@/rules/headerCellsOf.js'
import { isStickyHeader } from '@/rules/isStickyHeader.js'
import type { Rule } from '@/rules/Rule.js'
import { VIEWPORT_HEIGHTS_FOR_STICKY } from '@/rules/VIEWPORT_HEIGHTS_FOR_STICKY.js'

// A table taller than a screen and a half loses its column names as soon as
// it scrolls. The header cells, or the header row or table around them, must
// be `position: sticky`.
export const stickyTableHeader: Rule = (snapshot) => {
  const { elements } = snapshot
  return elements.flatMap((table) => {
    if (
      table.tag !== 'table' ||
      table.height <= snapshot.viewportHeight * VIEWPORT_HEIGHTS_FOR_STICKY
    )
      return []
    const header = headerCellsOf(table, elements)
    if (
      header.length === 0 ||
      header.some((cell) => isStickyHeader(cell, elements))
    )
      return []
    return [
      {
        rule: 'sticky-table-header',
        severity: 'warn',
        message: `a table ${String(table.height)}px tall scrolls its column names out of sight; make the header row position: sticky`,
        subject: table.selector,
        identity: table.selector,
      },
    ]
  })
}
