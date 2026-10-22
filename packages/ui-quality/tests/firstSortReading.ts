import type { SortCell } from '@/capture/SortCell.js'
import { cellSortReadings } from '@/capture/cellSortReadings.js'

export const firstSortReading = (cell: SortCell) => {
  const [reading] = cellSortReadings([cell])
  if (reading === undefined) throw new Error('Expected one cell reading')
  return reading
}
