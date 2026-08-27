const COLUMNS = [
  ['lint 0', (ids) => !ids.has('lint-flag') && !ids.has('lint-script')],
  ['ci', (ids) => !ids.has('ci-workflow')],
  ['pins', (ids) => ![...ids].some((id) => id.startsWith('action-pin:'))],
  [
    'gates',
    (ids) =>
      // A repository with no check:* entrypoint at all reports
      // `check-entrypoints` instead of ten `gate:` findings; without it here,
      // having none of the wiring would read as having all of it.
      !ids.has('check-entrypoints') &&
      ![...ids].some((id) => id.startsWith('gate:')),
  ],
  ['cov', (ids) => !ids.has('coverage-run') && !ids.has('coverage-thresholds')],
  ['hooks', (ids) => !ids.has('hooks')],
  ['vers', (ids) => ![...ids].some((id) => id.startsWith('version:'))],
]

/**
 * The estate as one table: a row per repository, a column per class of gate.
 *
 * The point is the shape of the estate rather than any one repository's
 * detail - a column of crosses says the baseline is missing a mechanism, not
 * that seventeen authors each made the same oversight. Every finding this
 * summarises is still available in full by running `create-baseline --check`
 * inside the repository the row names.
 */
export function formatEstate(rows) {
  const width = Math.max(10, ...rows.map((row) => row.name.length))
  const lines = [
    `${'repository'.padEnd(width)}  ${COLUMNS.map(([label]) => label.padEnd(7)).join('')}`,
    '-'.repeat(width + 2 + COLUMNS.length * 7),
  ]

  for (const row of rows) {
    if (row.error) {
      lines.push(`${row.name.padEnd(width)}  ${row.error}`)
      continue
    }
    // Only failures colour a cell. An informational finding - a monorepo
    // root whose lint delegates to its workspaces, say - is a note, not a
    // gap, and colouring it would make the estate look worse than it is.
    const ids = new Set(
      row.findings
        .filter((finding) => finding.level !== 'info')
        .map((finding) => finding.id),
    )
    const cells = COLUMNS.map(([, passes]) =>
      (passes(ids) ? 'ok' : 'FAIL').padEnd(7),
    )
    lines.push(`${row.name.padEnd(width)}  ${cells.join('')}`)
  }

  const clean = rows.filter(
    (row) =>
      !row.error && !row.findings.some((finding) => finding.level !== 'info'),
  ).length
  lines.push(
    '',
    `${rows.length} consumers, ${clean} fully wired.`,
    'Run `create-baseline --check` inside a repository for its findings, or',
    '`create-baseline --fix` to repair the mechanical ones.',
  )

  return lines.join('\n')
}
