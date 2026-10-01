import type { Finding } from '@/model/Finding.js'

export const renderFindingsJson = (findings: Finding[]): string =>
  JSON.stringify({ findings }, null, 2)
