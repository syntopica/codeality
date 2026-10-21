import { globSync } from 'tinyglobby'

import { existingEntries } from './existingEntries'

/** Omit unmatched preset patterns; caller patterns are never passed here. */
export const matchedPresetPatterns = (
  patterns: string[],
  cwd: string,
): string[] =>
  existingEntries(patterns, cwd).filter((pattern) => {
    const path = pattern.replace(/!$/u, '')
    return globSync(path, { cwd, dot: true }).length > 0
  })
