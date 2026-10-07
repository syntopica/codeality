import { idFirstColumn } from '@/rules/idFirstColumn.js'
import { rowHeightScale } from '@/rules/rowHeightScale.js'
import type { Rule } from '@/rules/Rule.js'
import { stickyTableHeader } from '@/rules/stickyTableHeader.js'

/** The rules about data tables: what leads the row, how tall rows are and whether the header follows. */
export const TABLE_RULES: Rule[] = [
  idFirstColumn,
  rowHeightScale,
  stickyTableHeader,
]
