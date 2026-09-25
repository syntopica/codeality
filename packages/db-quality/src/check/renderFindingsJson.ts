import type { Finding } from '@/model/Finding.js'

export const renderFindingsJson = (findings: Finding[]): string =>
  JSON.stringify({ schemaVersion: 1, findings }, null, 2)
