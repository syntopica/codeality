import type { DisableEntry } from '@/config/DisableEntry.js'

/** An entry without a `subject` disables the whole code; one with a `subject` only that finding. */
export const isDisabled = (
  code: string,
  disabled: DisableEntry[],
  subject?: string,
): boolean =>
  disabled.some(
    (entry) =>
      entry.code === code &&
      (entry.subject === undefined || entry.subject === subject),
  )
