import type { Finding } from '@/model/Finding.js'

export const compareFindings = (a: Finding, b: Finding): number =>
  a.path.localeCompare(b.path) ||
  a.line - b.line ||
  a.code.localeCompare(b.code)
