import { formatToolEstate } from './formatToolEstate.mjs'

const none = (ids, prefix) => ![...ids].some((id) => id.startsWith(prefix))

const COLUMNS = [
  ['lints', (ids) => none(ids, 'dart-lints')],
  ['ci', (ids) => !ids.has('dart-gate-job-missing')],
  ['pins', (ids) => none(ids, 'action-pin:')],
  ['release', (ids) => none(ids, 'dart-pin-')],
]

/** The Dart side of the estate: lints dependency, CI job, pins, release. */
export function formatDartEstate(rows) {
  return formatToolEstate('dart', 'Dart', COLUMNS, rows)
}
