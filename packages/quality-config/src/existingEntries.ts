import { existsSync } from 'node:fs'
import { join } from 'node:path'

const GLOB_CHARACTERS = /[*?{}[\]!]/u

/**
 * Drops the literal entry paths that do not exist in `cwd`; globs are kept,
 * since whether they match is knip's call. Used for a preset's default entry
 * when the caller names its own: a CLI package whose entry is
 * `src/cli/main.ts` has no `src/index.ts`, and listing it is a "Refine entry
 * pattern (no matches)" hint the caller cannot silence.
 */
export const existingEntries = (entries: string[], cwd: string): string[] =>
  entries.filter(
    (entry) =>
      GLOB_CHARACTERS.test(entry) ||
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- the entry is the preset's own literal, resolved against the project root
      existsSync(join(cwd, entry)),
  )
