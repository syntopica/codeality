import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { runAudit } from '@/audit/runAudit.js'
import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import { classifyFindings } from '@/baseline/classifyFindings.js'
import { readBaseline } from '@/baseline/readBaseline.js'
import type { CheckContext } from '@/check/CheckContext.js'
import { runCheck } from '@/check/runCheck.js'
import { perfStage } from '@/gate/perfStage.js'
import type { Stage } from '@/gate/Stage.js'

// A recorded baseline is the migration plan; the gate must honour it, or
// recording debt could never turn the gate green. Audit runs when the project
// is linked unless the configuration says otherwise: a linked project whose
// CI has no token must switch it off explicitly rather than pass by accident.
export const gateStages = (context: CheckContext): Stage[] => {
  const hasBaseline = existsSync(join(context.root, BASELINE_FILENAME))
  const linked = existsSync(join(context.root, 'supabase/.temp/project-ref'))
  return [
    hasBaseline
      ? {
          name: 'baseline-check',
          run: () =>
            classifyFindings(runCheck(context), readBaseline(context.root)).new,
        }
      : { name: 'check', run: () => runCheck(context) },
    {
      name: 'audit',
      run: () =>
        context.config.audit.inGate && linked
          ? runAudit({ ...context, target: { linked: true } })
          : 'not-applicable',
    },
    perfStage(context),
  ]
}
