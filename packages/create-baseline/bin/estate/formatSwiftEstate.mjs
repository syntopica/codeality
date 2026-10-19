import { formatToolEstate } from './formatToolEstate.mjs'

const none = (ids, prefix) => ![...ids].some((id) => id.startsWith(prefix))

const COLUMNS = [
  ['ci', (ids) => !ids.has('swift-gate-job-missing')],
  ['pins', (ids) => none(ids, 'action-pin:')],
  ['release', (ids) => none(ids, 'swift-pin-')],
]

/** The Swift side of the estate: CI job, action pins, release tag. */
export function formatSwiftEstate(rows) {
  return formatToolEstate('swift', 'Swift', COLUMNS, rows)
}
