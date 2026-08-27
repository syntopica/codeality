const MARKER = { error: 'FAIL', warn: 'WARN', info: 'note' }

/**
 * A conformance report as text.
 *
 * One line per finding with its id first: the id is what goes into
 * `baseline.exceptions.json` to waive it, so it has to be copy-pasteable
 * rather than reconstructed from prose. The detail is indented under it,
 * wrapped by the caller's terminal rather than hard-wrapped here.
 */
export function formatFindings({ findings, waived }) {
  const lines = []

  for (const finding of findings) {
    lines.push(
      `  ${MARKER[finding.level] ?? finding.level}  ${finding.id}  ${finding.message}`,
    )
    if (finding.detail) lines.push(`        ${finding.detail}`)
    if (finding.fix) lines.push('        (fixable with --fix)')
  }

  if (waived.length) {
    lines.push('', '  Waived by baseline.exceptions.json:')
    for (const finding of waived) {
      const expiry = finding.waiver.expires
        ? ` (expires ${finding.waiver.expires})`
        : ''
      lines.push(
        `    ${finding.id}  ${finding.message}${expiry}`,
        `        ${finding.waiver.reason}`,
      )
    }
  }

  return lines.join('\n')
}
