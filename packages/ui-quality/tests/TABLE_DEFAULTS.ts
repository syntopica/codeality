import type { TableSpec } from '@tests/TableSpec.js'

/** What `tableOf` builds when a spec leaves a part out. */
export const TABLE_DEFAULTS: Required<Omit<TableSpec, 'rows'>> = {
  rowHeight: () => 40,
  headerHeight: 40,
  headerPosition: 'static',
  firstCell: () => 'Acme',
  lines: () => 1,
}
