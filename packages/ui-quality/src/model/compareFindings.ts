import type { Finding } from '@/model/Finding.js'

export const compareFindings = (a: Finding, b: Finding): number =>
  a.route.localeCompare(b.route) ||
  a.rule.localeCompare(b.rule) ||
  a.subject.localeCompare(b.subject)
