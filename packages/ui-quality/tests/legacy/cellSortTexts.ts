import type { SortCell } from './SortCell.js'

/**
 * Reads each cell for ordering: the `datetime` of a `<time>` the cell opens
 * with, otherwise the text it shows. A date further in (a title with its
 * publication day under it) does not stand for the cell. Runs in the page,
 * so it must not close over anything.
 */
export const cellSortTexts = (cells: SortCell[]): string[] =>
  cells.map((cell) => {
    const time = cell.querySelector('time[datetime]')
    const shown = cell.innerText.trim()
    const opens = time !== null && shown.startsWith(time.innerText.trim())
    return opens ? (time.getAttribute('datetime') ?? shown) : cell.innerText
  })
