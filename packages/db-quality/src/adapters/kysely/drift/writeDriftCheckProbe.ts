import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { checkProbeLines } from '@/adapters/kysely/drift/checkProbeLines.js'
import type { DriftCheckProbe } from '@/adapters/kysely/drift/DriftCheckProbe.js'
import type { WriteDriftCheckProbeOptions } from '@/adapters/kysely/drift/WriteDriftCheckProbeOptions.js'

// Writes the second probe, which forces the compiler to check each shared
// column's live SELECT type against the declared one. One line per column
// keeps every diagnostic traceable back to its column by line number.
export const writeDriftCheckProbe = (
  options: WriteDriftCheckProbeOptions,
): DriftCheckProbe => {
  const { lines, sharedColumns } = checkProbeLines(options)
  const checkFile = join(options.scratch, 'check.ts')

  writeFileSync(checkFile, lines.join('\n') + '\n')
  return { checkFile, sharedColumns }
}
