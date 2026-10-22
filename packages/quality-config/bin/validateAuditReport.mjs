import { AUDIT_LEVELS } from './auditLevels.mjs'

export function validateAuditReport(report) {
  if (
    report === null ||
    typeof report !== 'object' ||
    Array.isArray(report) ||
    'error' in report
  ) {
    throw new Error('pnpm audit returned an error or invalid report.')
  }
  if (
    report.advisories === null ||
    typeof report.advisories !== 'object' ||
    Array.isArray(report.advisories)
  ) {
    throw new Error('pnpm audit report is missing its advisory map.')
  }
  const metadata = report.metadata
  if (
    metadata === null ||
    typeof metadata !== 'object' ||
    Array.isArray(metadata)
  ) {
    throw new Error('pnpm audit report is missing metadata.')
  }
  const counts = metadata.vulnerabilities
  if (counts === null || typeof counts !== 'object' || Array.isArray(counts)) {
    throw new Error('pnpm audit report is missing vulnerability counts.')
  }
  for (const key of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'totalDependencies',
  ]) {
    if (!Number.isInteger(metadata[key]) || metadata[key] < 0)
      throw new Error('Invalid audit dependency counts.')
  }
  for (const key of Object.keys(counts)) {
    if (!AUDIT_LEVELS.includes(key))
      throw new Error('Unknown audit vulnerability count severity.')
  }
  const observed = Object.create(null)
  for (const level of AUDIT_LEVELS) {
    if (!Number.isInteger(counts[level]) || counts[level] < 0)
      throw new Error('Invalid audit vulnerability counts.')
    observed[level] = 0
  }
  for (const advisory of Object.values(report.advisories)) {
    if (
      advisory === null ||
      typeof advisory !== 'object' ||
      Array.isArray(advisory)
    ) {
      throw new Error('Invalid audit advisory.')
    }
    if (
      !AUDIT_LEVELS.includes(advisory.severity) ||
      typeof advisory.module_name !== 'string' ||
      !advisory.module_name ||
      !['number', 'string'].includes(typeof advisory.id)
    ) {
      throw new Error('Invalid audit advisory identity or severity.')
    }
    if (
      advisory.github_advisory_id !== undefined &&
      typeof advisory.github_advisory_id !== 'string'
    ) {
      throw new Error('Invalid GitHub advisory identity.')
    }
    for (const key of ['title', 'url', 'vulnerable_versions']) {
      if (typeof advisory[key] !== 'string')
        throw new Error('Incomplete audit advisory.')
    }
    if (
      !Object.hasOwn(advisory, 'patched_versions') ||
      (advisory.patched_versions !== null &&
        typeof advisory.patched_versions !== 'string')
    ) {
      throw new Error('Invalid patched-version metadata.')
    }
    if (!Array.isArray(advisory.findings))
      throw new Error('Incomplete audit dependency findings.')
    for (const finding of advisory.findings) {
      if (
        finding === null ||
        typeof finding !== 'object' ||
        !Array.isArray(finding.paths)
      ) {
        throw new Error('Incomplete audit dependency paths.')
      }
      for (const path of finding.paths) {
        if (typeof path !== 'string')
          throw new Error('Invalid audit dependency path.')
      }
    }
    observed[advisory.severity] += 1
  }
  for (const level of AUDIT_LEVELS) {
    if (observed[level] !== counts[level])
      throw new Error('Audit advisory counts do not match metadata.')
  }
  return report
}
