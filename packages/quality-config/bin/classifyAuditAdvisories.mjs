import { AUDIT_LEVELS } from './auditLevels.mjs'

export function classifyAuditAdvisories(advisories, allowlist, level, today) {
  const minimum = AUDIT_LEVELS.indexOf(level)
  const failures = []
  const waived = []
  const stale = []
  for (const advisory of advisories) {
    if (AUDIT_LEVELS.indexOf(advisory.severity) < minimum) continue
    const githubEntry = Object.hasOwn(allowlist, advisory.github_advisory_id)
      ? allowlist[advisory.github_advisory_id]
      : undefined
    const numericEntry = Object.hasOwn(allowlist, String(advisory.id))
      ? allowlist[String(advisory.id)]
      : undefined
    const entry = githubEntry ?? numericEntry
    if (!entry) failures.push(advisory)
    else if (entry.expires < today) stale.push({ advisory, entry })
    else waived.push({ advisory, entry })
  }
  return { failures, waived, stale }
}
