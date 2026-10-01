import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import type { CheckContext } from '@/check/CheckContext.js'
import { runCheck } from '@/check/runCheck.js'
import type { BaselineStep } from '@/init/BaselineStepType.js'
import { classifyFindings } from '@syntopica/gate-kit/classifyFindings'
import { readBaseline } from '@syntopica/gate-kit/readBaseline'

/** Runs `check` and says whether the baseline covers every finding it reports. */
export const baselineStep = (context: CheckContext): BaselineStep => {
  const findings = runCheck(context)
  if (findings.length === 0) return 'covered'
  if (!existsSync(join(context.root, BASELINE_FILENAME))) return 'create'
  const classified = classifyFindings(
    findings,
    readBaseline(context.root, BASELINE_FILENAME, 'codeality-db'),
  )
  return classified.new.length > 0 ? 'update' : 'covered'
}
