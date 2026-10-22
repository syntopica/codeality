import type { CellSortReading } from '@/capture/CellSortReading.js'
import type { SortCell } from '@/capture/SortCell.js'

/** Atomic browser evidence; only type imports, no runtime closure dependencies. */
export const cellSortReadings = (cells: SortCell[]): CellSortReading[] => {
  const readings: CellSortReading[] = []
  for (const cell of cells) {
    if (cell.innerText === undefined)
      throw new Error('Sorting requires an HTML table cell')
    const time = cell.querySelector('time[datetime]')
    const shown = cell.innerText.trim()
    const opens =
      time !== null &&
      shown.startsWith(String.prototype.trim.call(time.innerText))
    const reading: CellSortReading = {
      text: opens ? (time.getAttribute('datetime') ?? shown) : cell.innerText,
      declaration: null,
    }
    readings.push(reading)
    const declarations = cell.querySelectorAll(
      '[data-codeality-sort-type], [data-codeality-sort-value]',
    )
    const declaration = declarations[0]
    if (declaration === undefined) continue
    const admission = [
      declarations.length === 1,
      Array.from(declaration.getClientRects()).some(
        (rect) => rect.width > 0 && rect.height > 0,
      ),
      declaration.checkVisibility?.({
        checkOpacity: true,
        checkVisibilityCSS: true,
      }) === true,
    ]
    if (admission.every(Boolean)) {
      reading.declaration = {
        type: declaration.getAttribute('data-codeality-sort-type'),
        value: declaration.getAttribute('data-codeality-sort-value'),
      }
    }
  }
  return readings
}
