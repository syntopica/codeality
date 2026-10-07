export type TableSpec = {
  rows: number
  rowHeight?: (index: number) => number
  headerHeight?: number
  headerPosition?: string
  firstCell?: (index: number) => string
  lines?: (index: number) => number
}
