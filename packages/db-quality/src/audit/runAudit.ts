import { runSoda } from '@/adapters/soda/runSoda.js'
import { runAdvisors } from '@/adapters/supabase/runAdvisors.js'
import { runInspect } from '@/adapters/supabase/runInspect.js'
import type { AuditContext } from '@/audit/AuditContext.js'
import { auditPlan } from '@/audit/auditPlan.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'

export const runAudit = ({
  root,
  config,
  runner,
  target,
}: AuditContext): Finding[] => {
  const plan = auditPlan(config, target)
  const findings: Finding[] = []
  if (plan.soda && 'dbUrl' in target && config.audit.soda !== undefined) {
    const soda = { dir: config.audit.soda, url: target.dbUrl }
    findings.push(...runSoda(runner, root, soda, config.disable))
  }
  if (plan.supabase) {
    findings.push(
      ...runAdvisors(runner, root, target, config.disable),
      ...runInspect(runner, root, target, config),
    )
  }
  return findings.sort(compareFindings)
}
