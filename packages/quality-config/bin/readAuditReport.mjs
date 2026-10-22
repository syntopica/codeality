import { validateAuditReport } from './validateAuditReport.mjs'

export function readAuditReport(result) {
  if (
    result.error ||
    result.signal ||
    (result.status !== 0 && result.status !== 1)
  ) {
    throw new Error('Could not complete pnpm audit.')
  }
  let report
  try {
    report = JSON.parse(result.stdout)
  } catch {
    throw new Error('pnpm audit did not return JSON.')
  }
  return validateAuditReport(report)
}
