import type { RawFinding } from '@/model/RawFinding.js'

/** A `dark-scheme-incomplete` finding. */
export const darkFinding = (
  message: string,
  subject: string,
  identity: string,
): RawFinding => ({
  rule: 'dark-scheme-incomplete',
  severity: 'error',
  message,
  subject,
  identity,
})
