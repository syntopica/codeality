import { formatToolEstate } from './formatToolEstate.mjs'

const none = (ids, prefix) => ![...ids].some((id) => id.startsWith(prefix))

const COLUMNS = [
  ['ci', (ids) => !ids.has('go-gate-job-missing')],
  ['pins', (ids) => none(ids, 'action-pin:')],
  ['release', (ids) => none(ids, 'go-pin-')],
]

/** The Go side of the estate: CI job, action pins, released tool. */
export function formatGoEstate(rows) {
  return formatToolEstate('go', 'Go', COLUMNS, rows)
}
