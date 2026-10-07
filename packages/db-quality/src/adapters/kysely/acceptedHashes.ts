import type { KyselyDialect } from '@/config/KyselyDialect.js'

/** The hashes to record for one migration, or undefined when it was edited and not accepted. */
export const acceptedHashes = (
  before: Partial<Record<KyselyDialect, string>> | undefined,
  now: Partial<Record<KyselyDialect, string>>,
  accepted: boolean,
): Partial<Record<KyselyDialect, string>> | undefined => {
  const edited = Object.entries(now).some(([dialect, hash]) => {
    const recorded = before?.[dialect as KyselyDialect]
    return recorded !== undefined && recorded !== hash
  })
  return edited && !accepted ? undefined : { ...before, ...now }
}
