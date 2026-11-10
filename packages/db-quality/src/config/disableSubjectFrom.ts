import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/** A `disable` entry's optional `subject`, validated: only type drift reports one finding per table or column. */
export const disableSubjectFrom = (
  code: string,
  subject: unknown,
): string | undefined => {
  if (subject === undefined) return undefined
  // Elsewhere a subject would silently match nothing.
  if (!code.startsWith('BDB330/'))
    throw new ConfigError(
      `disable subject is only supported on BDB330 codes (${code})`,
    )
  if (typeof subject !== 'string' || subject.trim() === '')
    throw new ConfigError(
      `disable subject must be a non-empty string (${code})`,
    )
  return subject
}
