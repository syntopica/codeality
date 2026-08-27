import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const FILE = 'baseline.exceptions.json'

/**
 * Documented deviations from the baseline, read from `baseline.exceptions.json`.
 *
 * Shape: `{ "<finding id>": { "reason": "...", "expires": "YYYY-MM-DD" } }`.
 *
 * `reason` is required. An exception without one is rejected rather than
 * honoured, because a silent waiver and a missing gate are the same thing from
 * outside - the whole point of the file is that the deviation stays visible in
 * review instead of being absent from the report.
 *
 * `expires` is optional and, when present, enforced: a stale waiver becomes a
 * finding of its own. That is the difference between this file and the prose
 * exceptions that accumulated in TODO.md, where nothing ever re-checked them.
 */
export async function loadExceptions(root, today) {
  let raw
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    raw = await readFile(resolve(root, FILE), 'utf8')
  } catch {
    return { waived: new Map(), findings: [] }
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return {
      waived: new Map(),
      findings: [
        {
          id: 'exceptions',
          level: 'error',
          message: `${FILE} is not valid JSON`,
          detail: String(error.message),
        },
      ],
    }
  }

  const waived = new Map()
  const findings = []

  for (const [id, entry] of Object.entries(parsed)) {
    if (!entry?.reason) {
      findings.push({
        id: `exceptions:${id}`,
        level: 'error',
        message: `waiver for \`${id}\` has no reason`,
        detail:
          'An undocumented waiver is indistinguishable from a missing gate.',
      })
      continue
    }
    if (entry.expires && entry.expires < today) {
      findings.push({
        id: `exceptions:${id}`,
        level: 'error',
        message: `waiver for \`${id}\` expired on ${entry.expires}`,
        detail: `Reason given: ${entry.reason}. Re-check it, then renew or remove it.`,
      })
      continue
    }
    waived.set(id, entry)
  }

  return { waived, findings }
}
