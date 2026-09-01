const COLUMNS = [
  ['group', (ids) => !ids.has('py-tool') && !ids.has('py-quality-group')],
  ['ci', (ids) => !ids.has('py-ci-workflow')],
  ['pins', (ids) => ![...ids].some((id) => id.startsWith('action-pin:'))],
  ['lock', (ids) => !ids.has('py-lock')],
]

/**
 * The Python side of the estate as one table, a row per project.
 *
 * Kept apart from the JavaScript table because the columns differ: there is
 * no tsconfig or lint flag to check, and a shared table would show every
 * Python row failing gates it does not have.
 */
export function formatPythonEstate(rows) {
  const width = Math.max(10, ...rows.map((row) => row.name.length))
  const lines = [
    `${'python'.padEnd(width)}  ${COLUMNS.map(([label]) => label.padEnd(7)).join('')}`,
    '-'.repeat(width + 2 + COLUMNS.length * 7),
  ]
  for (const row of rows) {
    if (row.error) {
      lines.push(`${row.name.padEnd(width)}  ${row.error}`)
      continue
    }
    const ids = new Set(row.findings.map((finding) => finding.id))
    const cells = COLUMNS.map(([, passes]) =>
      (passes(ids) ? 'ok' : 'FAIL').padEnd(7),
    )
    lines.push(`${row.name.padEnd(width)}  ${cells.join('')}`)
  }
  const clean = rows.filter(
    (row) => !row.error && row.findings.length === 0,
  ).length
  lines.push('', `${rows.length} Python projects, ${clean} fully wired.`)
  return lines.join('\n')
}
