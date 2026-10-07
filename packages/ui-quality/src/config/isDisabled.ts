import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Finding } from '@/model/Finding.js'

export const isDisabled = (
  finding: Finding,
  entries: DisableEntry[],
): boolean =>
  entries.some(
    (entry) =>
      (entry.rule === finding.rule || entry.rule === '*') &&
      (entry.route === null || entry.route === finding.route) &&
      (entry.selector === null || finding.subject.includes(entry.selector)) &&
      (entry.message === null || finding.message.includes(entry.message)),
  )
