import { runSoda } from '@/adapters/soda/runSoda.js'
import { runAdvisors } from '@/adapters/supabase/runAdvisors.js'
import { runInspect } from '@/adapters/supabase/runInspect.js'
import type { AuditContext } from '@/audit/AuditContext.js'
import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'

/** Advisors and inspect always; Soda only with a URL, since a linked target carries no password. */
export const runAudit = ({
  root,
  config,
  runner,
  target,
}: AuditContext): Finding[] => {
  const findings = [
    ...runAdvisors(runner, root, target, config.disable),
    ...runInspect(runner, root, target, config),
  ]
  if (config.audit.soda && 'dbUrl' in target) {
    findings.push(
      ...runSoda(
        runner,
        root,
        { dir: config.audit.soda, url: target.dbUrl },
        config.disable,
      ),
    )
  }
  return findings.sort(compareFindings)
}
