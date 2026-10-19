/**
 * One language's side of the estate as a table, a row per project:
 * `columns` are `[label, passes(ids)]`, `rows` are `{ name, findings }` or
 * `{ name, error }`.
 */
export function formatToolEstate(label, noun, columns, rows) {
  const width = Math.max(10, ...rows.map((row) => row.name.length))
  const lines = [
    `${label.padEnd(width)}  ${columns.map(([column]) => column.padEnd(7)).join('')}`,
    '-'.repeat(width + 2 + columns.length * 7),
  ]
  for (const row of rows) {
    if (row.error) {
      lines.push(`${row.name.padEnd(width)}  ${row.error}`)
      continue
    }
    const ids = new Set(row.findings.map((finding) => finding.id))
    const cells = columns.map(([, passes]) =>
      (passes(ids) ? 'ok' : 'FAIL').padEnd(7),
    )
    lines.push(`${row.name.padEnd(width)}  ${cells.join('')}`.trimEnd())
  }
  const clean = rows.filter(
    (row) => !row.error && row.findings.length === 0,
  ).length
  lines.push('', `${rows.length} ${noun} projects, ${clean} fully wired.`)
  return lines.join('\n')
}
